import { cactiConnector } from '../cacti/CactiConnector.js';
import StellarSdk from 'stellar-sdk';
import { ethers } from 'ethers';

export class BridgeService {
  constructor() {
    this.bridgeTransactions = new Map();
    this.stellarServer = new StellarSdk.Server('https://horizon-testnet.stellar.org');
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
      // Validate bridge parameters
      await cactiConnector.validateBridgeTransaction(fromChain, toChain, amount, token);

      // Generate unique bridge ID
      const bridgeId = this.generateBridgeId();

      // Store bridge request
      this.bridgeTransactions.set(bridgeId, {
        ...bridgeRequest,
        status: 'initiated',
        timestamp: Date.now(),
      });

      // Execute bridge based on source chain
      let result;
      if (fromChain === 'stellar') {
        result = await this.bridgeFromStellar(bridgeId, toChain, amount, token, fromAddress, toAddress);
      } else {
        result = await this.bridgeToStellar(bridgeId, fromChain, amount, token, fromAddress, toAddress);
      }

      // Update bridge status
      this.bridgeTransactions.set(bridgeId, {
        ...this.bridgeTransactions.get(bridgeId),
        status: 'processing',
        ...result,
      });

      return {
        bridgeId,
        status: 'processing',
        ...result,
      };
    } catch (error) {
      console.error('Bridge initiation failed:', error);
      throw new Error(`Bridge initiation failed: ${error.message}`);
    }
  }

  async bridgeFromStellar(bridgeId, toChain, amount, token, fromAddress, toAddress) {
    try {
      // Create Stellar lock transaction
      const bridgeKeypair = StellarSdk.Keypair.fromSecret(process.env.STELLAR_SECRET_KEY);
      const bridgeAccount = await this.stellarServer.loadAccount(bridgeKeypair.publicKey());

      const stellarTx = new StellarSdk.TransactionBuilder(bridgeAccount, {
        fee: '100',
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: bridgeKeypair.publicKey(), // Lock to bridge account
            asset: token === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset(token, process.env.STELLAR_ISSUER),
            amount: amount.toString(),
            source: fromAddress,
          })
        )
        .addMemo(StellarSdk.Memo.text(`Bridge to ${toChain}: ${bridgeId}`))
        .setTimeout(30)
        .build();

      // Use Cacti to execute cross-chain bridge
      const bridgeResult = await cactiConnector.bridgeFromStellarToEthereum(
        stellarTx.toXDR(),
        toAddress,
        this.convertAmount(amount, token, 'stellar', toChain)
      );

      return {
        stellarTxHash: bridgeResult.stellarTxHash,
        targetTxHash: bridgeResult.ethereumTxHash,
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
      // Create Ethereum lock transaction
      const provider = new ethers.providers.JsonRpcProvider(this.getChainRpcUrl(fromChain));
      const bridgeWallet = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, provider);

      const ethereumTx = {
        to: bridgeWallet.address, // Lock to bridge address
        value: ethers.utils.parseEther(amount.toString()),
        gasLimit: 21000,
        data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(`Bridge to Stellar: ${bridgeId}`)),
      };

      // Use Cacti to execute cross-chain bridge
      const bridgeResult = await cactiConnector.bridgeFromEthereumToStellar(
        ethereumTx,
        toAddress,
        this.convertAmount(amount, token, fromChain, 'stellar')
      );

      return {
        sourceTxHash: bridgeResult.ethereumTxHash,
        stellarTxHash: bridgeResult.stellarTxHash,
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

    try {
      // Check transaction status on both chains
      const statusChecks = [];

      if (bridgeData.stellarTxHash) {
        statusChecks.push(
          cactiConnector.getTransactionStatus(bridgeData.stellarTxHash, 'stellar')
        );
      }

      if (bridgeData.targetTxHash || bridgeData.sourceTxHash) {
        const txHash = bridgeData.targetTxHash || bridgeData.sourceTxHash;
        const chain = bridgeData.toChain === 'stellar' ? bridgeData.fromChain : bridgeData.toChain;
        statusChecks.push(
          cactiConnector.getTransactionStatus(txHash, chain)
        );
      }

      const results = await Promise.allSettled(statusChecks);
      
      // Determine overall status
      const allConfirmed = results.every(result => 
        result.status === 'fulfilled' && result.value.confirmed
      );

      const status = allConfirmed ? 'completed' : 'processing';

      // Update stored status
      this.bridgeTransactions.set(bridgeId, {
        ...bridgeData,
        status,
        lastChecked: Date.now(),
      });

      return {
        bridgeId,
        status,
        ...bridgeData,
        confirmations: results.map(r => r.status === 'fulfilled' ? r.value : null),
      };
    } catch (error) {
      console.error('Status check failed:', error);
      return {
        bridgeId,
        status: 'error',
        error: error.message,
        ...bridgeData,
      };
    }
  }

  convertAmount(amount, token, fromChain, toChain) {
    // Simplified conversion rates (in production, use real-time rates)
    const rates = {
      'XLM-ETH': 0.00003, // 1 XLM = 0.00003 ETH
      'ETH-XLM': 33333,   // 1 ETH = 33333 XLM
      'USDC-USDC': 1,     // 1:1 for stablecoins
    };

    const conversionKey = `${token}-${this.getChainToken(toChain)}`;
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

  getChainRpcUrl(chain) {
    const urls = {
      ethereum: process.env.ETHEREUM_RPC_URL,
      base: process.env.BASE_RPC_URL,
      optimism: process.env.OPTIMISM_RPC_URL,
    };
    return urls[chain] || process.env.ETHEREUM_RPC_URL;
  }

  generateBridgeId() {
    return `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  async verifyBridgeIntegrity(bridgeId) {
    const bridgeData = this.bridgeTransactions.get(bridgeId);
    if (!bridgeData) {
      throw new Error('Bridge transaction not found');
    }

    try {
      // Verify lock transaction
      const lockVerified = await this.verifyLockTransaction(bridgeData);
      
      // Verify release transaction
      const releaseVerified = await this.verifyReleaseTransaction(bridgeData);

      return {
        bridgeId,
        lockVerified,
        releaseVerified,
        integrityCheck: lockVerified && releaseVerified,
      };
    } catch (error) {
      console.error('Bridge integrity check failed:', error);
      return {
        bridgeId,
        integrityCheck: false,
        error: error.message,
      };
    }
  }

  async verifyLockTransaction(bridgeData) {
    try {
      if (bridgeData.fromChain === 'stellar') {
        const transaction = await this.stellarServer.transactions()
          .transaction(bridgeData.stellarTxHash)
          .call();
        
        return transaction.successful;
      } else {
        const provider = new ethers.providers.JsonRpcProvider(
          this.getChainRpcUrl(bridgeData.fromChain)
        );
        const receipt = await provider.getTransactionReceipt(bridgeData.sourceTxHash);
        
        return receipt && receipt.status === 1;
      }
    } catch (error) {
      console.error('Lock transaction verification failed:', error);
      return false;
    }
  }

  async verifyReleaseTransaction(bridgeData) {
    try {
      if (bridgeData.toChain === 'stellar') {
        const transaction = await this.stellarServer.transactions()
          .transaction(bridgeData.stellarTxHash)
          .call();
        
        return transaction.successful;
      } else {
        const provider = new ethers.providers.JsonRpcProvider(
          this.getChainRpcUrl(bridgeData.toChain)
        );
        const receipt = await provider.getTransactionReceipt(bridgeData.targetTxHash);
        
        return receipt && receipt.status === 1;
      }
    } catch (error) {
      console.error('Release transaction verification failed:', error);
      return false;
    }
  }
}

export const bridgeService = new BridgeService();