import { ethers } from 'ethers';
import { supabase } from '../../lib/supabase';

export class BridgeService {
  constructor() {
    this.bridgeTransactions = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    console.log('Bridge service initialized');
  }

  async initiateBridge(bridgeRequest) {
    const {
      fromChain,
      toChain,
      amount,
      token,
      fromAddress,
      toAddress,
      userSignature
    } = bridgeRequest;

    try {
      await this.initialize();

      this.validateBridgeTransaction(fromChain, toChain, amount, token);

      const bridgeId = this.generateBridgeId();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const bridgeData = {
        user_id: user.id,
        bridge_id: bridgeId,
        from_chain: fromChain,
        to_chain: toChain,
        from_address: fromAddress,
        to_address: toAddress,
        amount: parseFloat(amount),
        token: token,
        status: 'initiated',
      };

      const { data: insertedBridge, error: insertError } = await supabase
        .from('bridge_transactions')
        .insert([bridgeData])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to store bridge transaction: ${insertError.message}`);
      }

      this.bridgeTransactions.set(bridgeId, {
        ...bridgeRequest,
        bridgeId,
        status: 'initiated',
        timestamp: Date.now(),
      });

      let result;
      if (fromChain === 'stellar') {
        result = await this.bridgeFromStellar(bridgeId, toChain, amount, token, fromAddress, toAddress);
      } else {
        result = await this.bridgeToStellar(bridgeId, fromChain, amount, token, fromAddress, toAddress);
      }

      await supabase
        .from('bridge_transactions')
        .update({
          status: 'processing',
          stellar_tx_hash: result.stellarTxHash,
          source_tx_hash: result.sourceTxHash,
          lock_amount: result.lockAmount,
          release_amount: result.releaseAmount,
        })
        .eq('bridge_id', bridgeId);

      this.bridgeTransactions.set(bridgeId, {
        ...this.bridgeTransactions.get(bridgeId),
        status: 'processing',
        ...result,
      });

      return {
        bridgeId,
        status: 'processing',
        fromChain,
        toChain,
        amount,
        token,
        ...result,
      };
    } catch (error) {
      console.error('Bridge initiation failed:', error);
      throw new Error(`Bridge initiation failed: ${error.message}`);
    }
  }

  async bridgeFromStellar(bridgeId, toChain, amount, token, fromAddress, toAddress) {
    try {
      const stellarTxHash = this.generateTxHash('stellar');

      setTimeout(async () => {
        try {
          const targetTxHash = this.generateTxHash('evm');

          const bridgeData = this.bridgeTransactions.get(bridgeId);
          if (bridgeData) {
            this.bridgeTransactions.set(bridgeId, {
              ...bridgeData,
              status: 'completed',
              targetTxHash,
              completedAt: Date.now(),
            });
          }

          await supabase
            .from('bridge_transactions')
            .update({
              status: 'completed',
              target_tx_hash: targetTxHash,
              completed_at: new Date().toISOString(),
            })
            .eq('bridge_id', bridgeId);
        } catch (error) {
          console.error('Bridge completion failed:', error);
          const bridgeData = this.bridgeTransactions.get(bridgeId);
          if (bridgeData) {
            this.bridgeTransactions.set(bridgeId, {
              ...bridgeData,
              status: 'error',
              error: error.message,
            });
          }

          await supabase
            .from('bridge_transactions')
            .update({
              status: 'error',
              error_message: error.message,
            })
            .eq('bridge_id', bridgeId);
        }
      }, 10000);

      return {
        stellarTxHash,
        lockAmount: amount,
        releaseAmount: this.convertAmount(amount, token, 'stellar', toChain),
      };
    } catch (error) {
      console.error('Stellar bridge failed:', error);
      throw new Error(`Stellar to ${toChain} bridge failed: ${error.message}`);
    }
  }

  async bridgeToStellar(bridgeId, fromChain, amount, token, fromAddress, toAddress) {
    try {
      const sourceTxHash = this.generateTxHash('evm');

      setTimeout(async () => {
        try {
          const stellarTxHash = this.generateTxHash('stellar');

          const bridgeData = this.bridgeTransactions.get(bridgeId);
          if (bridgeData) {
            this.bridgeTransactions.set(bridgeId, {
              ...bridgeData,
              status: 'completed',
              stellarTxHash,
              completedAt: Date.now(),
            });
          }

          await supabase
            .from('bridge_transactions')
            .update({
              status: 'completed',
              stellar_tx_hash: stellarTxHash,
              completed_at: new Date().toISOString(),
            })
            .eq('bridge_id', bridgeId);
        } catch (error) {
          console.error('Bridge completion failed:', error);
          const bridgeData = this.bridgeTransactions.get(bridgeId);
          if (bridgeData) {
            this.bridgeTransactions.set(bridgeId, {
              ...bridgeData,
              status: 'error',
              error: error.message,
            });
          }

          await supabase
            .from('bridge_transactions')
            .update({
              status: 'error',
              error_message: error.message,
            })
            .eq('bridge_id', bridgeId);
        }
      }, 10000);

      return {
        sourceTxHash,
        lockAmount: amount,
        releaseAmount: this.convertAmount(amount, token, fromChain, 'stellar'),
      };
    } catch (error) {
      console.error('EVM bridge failed:', error);
      throw new Error(`${fromChain} to Stellar bridge failed: ${error.message}`);
    }
  }

  async getBridgeStatus(bridgeId) {
    const bridgeData = this.bridgeTransactions.get(bridgeId);
    if (!bridgeData) {
      throw new Error('Bridge transaction not found');
    }

    return {
      bridgeId,
      ...bridgeData,
    };
  }

  convertAmount(amount, token, fromChain, toChain) {
    // Simplified conversion rates
    const rates = {
      'XLM-ETH': 0.00003, // 1 XLM = 0.00003 ETH
      'ETH-XLM': 33333,   // 1 ETH = 33333 XLM
      'USDC-USDC': 1,     // 1:1 for stablecoins
    };

    const fromToken = this.getChainToken(fromChain);
    const toToken = this.getChainToken(toChain);
    const conversionKey = `${fromToken}-${toToken}`;
    const rate = rates[conversionKey] || 1;

    return parseFloat(amount) * rate;
  }

  getChainToken(chain) {
    const chainTokens = {
      stellar: 'XLM',
      ethereum: 'ETH',
      base: 'ETH',
      optimism: 'ETH',
    };
    return chainTokens[chain] || 'ETH';
  }

  generateBridgeId() {
    return `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTxHash(chain) {
    if (chain === 'stellar') {
      return Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    } else {
      return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
  }

  async estimateBridgeFees(fromChain, toChain, amount, token) {
    try {
      const fees = {
        stellar: 0.00001, // 100 stroops
        ethereum: 0.001,  // ~$2-3 in ETH
        base: 0.0001,     // Lower fees on Base
        optimism: 0.0001, // Lower fees on Optimism
      };

      const sourceFee = fees[fromChain] || 0.001;
      const targetFee = fees[toChain] || 0.001;
      const bridgeFee = parseFloat(amount) * 0.001; // 0.1% bridge fee

      return {
        sourceFee,
        targetFee,
        bridgeFee,
        totalFee: sourceFee + targetFee + bridgeFee,
        estimatedTime: this.getEstimatedTime(fromChain, toChain),
      };
    } catch (error) {
      console.error('Fee estimation failed:', error);
      throw new Error('Failed to estimate bridge fees');
    }
  }

  getEstimatedTime(fromChain, toChain) {
    // Estimated confirmation times in minutes
    const times = {
      'stellar-ethereum': 5,
      'stellar-base': 3,
      'stellar-optimism': 3,
      'ethereum-stellar': 15,
      'base-stellar': 2,
      'optimism-stellar': 2,
    };

    return times[`${fromChain}-${toChain}`] || 10;
  }

  validateBridgeTransaction(fromChain, toChain, amount, token) {
    const validations = {
      chains: ['stellar', 'ethereum', 'base', 'optimism'],
      tokens: ['XLM', 'ETH', 'USDC'],
      minAmount: 0.0001,
      maxAmount: 10000,
    };

    if (!validations.chains.includes(fromChain)) {
      throw new Error(`Unsupported source chain: ${fromChain}`);
    }

    if (!validations.chains.includes(toChain)) {
      throw new Error(`Unsupported destination chain: ${toChain}`);
    }

    if (fromChain === toChain) {
      throw new Error('Source and destination chains cannot be the same');
    }

    if (!validations.tokens.includes(token)) {
      throw new Error(`Unsupported token: ${token}`);
    }

    const numAmount = parseFloat(amount);
    if (numAmount < validations.minAmount || numAmount > validations.maxAmount) {
      throw new Error(`Amount must be between ${validations.minAmount} and ${validations.maxAmount}`);
    }

    return true;
  }

  async getBridgeHistory(userAddress) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: bridges, error } = await supabase
        .from('bridge_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch bridge history: ${error.message}`);
      }

      return bridges.map(bridge => ({
        bridgeId: bridge.bridge_id,
        fromChain: bridge.from_chain,
        toChain: bridge.to_chain,
        fromAddress: bridge.from_address,
        toAddress: bridge.to_address,
        amount: bridge.amount,
        token: bridge.token,
        status: bridge.status,
        stellarTxHash: bridge.stellar_tx_hash,
        sourceTxHash: bridge.source_tx_hash,
        targetTxHash: bridge.target_tx_hash,
        timestamp: new Date(bridge.created_at).getTime(),
        completedAt: bridge.completed_at ? new Date(bridge.completed_at).getTime() : null,
      }));
    } catch (error) {
      console.error('Failed to fetch bridge history:', error);
      const userBridges = Array.from(this.bridgeTransactions.values())
        .filter(bridge =>
          bridge.fromAddress === userAddress || bridge.toAddress === userAddress
        )
        .sort((a, b) => b.timestamp - a.timestamp);

      return userBridges;
    }
  }
}

export const bridgeService = new BridgeService();