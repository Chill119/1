import StellarSdk from 'stellar-sdk';
import { ethers } from 'ethers';

export class CactiConnector {
  constructor() {
    this.stellarServer = new StellarSdk.Server('https://horizon-testnet.stellar.org');
    this.initialized = false;
    this.bridgeKeypair = null;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize bridge keypair from environment
      if (process.env.STELLAR_SECRET_KEY) {
        this.bridgeKeypair = StellarSdk.Keypair.fromSecret(process.env.STELLAR_SECRET_KEY);
      }

      this.initialized = true;
      console.log('Bridge connector initialized successfully');
    } catch (error) {
      console.error('Failed to initialize bridge connector:', error);
      throw new Error('Cross-chain connector initialization failed');
    }
  }

  async bridgeFromStellarToEthereum(stellarTxXdr, ethereumRecipient, amount) {
    await this.initialize();

    try {
      // Step 1: Submit Stellar transaction
      const stellarTx = StellarSdk.TransactionBuilder.fromXDR(stellarTxXdr, StellarSdk.Networks.TESTNET);
      const stellarResult = await this.stellarServer.submitTransaction(stellarTx);

      if (!stellarResult.successful) {
        throw new Error('Stellar transaction failed');
      }

      // Step 2: Execute corresponding Ethereum transaction
      const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      const bridgeWallet = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, provider);

      const ethereumTx = await bridgeWallet.sendTransaction({
        to: ethereumRecipient,
        value: ethers.utils.parseEther(amount.toString()),
        gasLimit: 21000,
      });

      await ethereumTx.wait();

      return {
        stellarTxHash: stellarResult.hash,
        ethereumTxHash: ethereumTx.hash,
        status: 'completed',
      };
    } catch (error) {
      console.error('Bridge transaction failed:', error);
      throw new Error(`Cross-chain bridge failed: ${error.message}`);
    }
  }

  async bridgeFromEthereumToStellar(ethereumTxConfig, stellarRecipient, amount) {
    await this.initialize();

    try {
      // Step 1: Execute Ethereum transaction
      const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
      const bridgeWallet = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, provider);

      const ethereumTx = await bridgeWallet.sendTransaction(ethereumTxConfig);
      const ethereumResult = await ethereumTx.wait();

      if (!ethereumResult.status) {
        throw new Error('Ethereum transaction failed');
      }

      // Step 2: Execute corresponding Stellar transaction
      if (!this.bridgeKeypair) {
        throw new Error('Bridge keypair not initialized');
      }

      const bridgeAccount = await this.stellarServer.loadAccount(this.bridgeKeypair.publicKey());

      const stellarTx = new StellarSdk.TransactionBuilder(bridgeAccount, {
        fee: '100',
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: stellarRecipient,
            asset: StellarSdk.Asset.native(),
            amount: amount.toString(),
          })
        )
        .addMemo(StellarSdk.Memo.text(`Bridge from ETH: ${ethereumTx.hash}`))
        .setTimeout(30)
        .build();

      stellarTx.sign(this.bridgeKeypair);
      const stellarResult = await this.stellarServer.submitTransaction(stellarTx);

      return {
        ethereumTxHash: ethereumTx.hash,
        stellarTxHash: stellarResult.hash,
        status: 'completed',
      };
    } catch (error) {
      console.error('Bridge transaction failed:', error);
      throw new Error(`Cross-chain bridge failed: ${error.message}`);
    }
  }

  async getTransactionStatus(txHash, chain) {
    await this.initialize();

    try {
      if (chain === 'stellar') {
        const transaction = await this.stellarServer.transactions()
          .transaction(txHash)
          .call();
        
        return {
          confirmed: transaction.successful,
          status: transaction.successful ? 'success' : 'failed',
          blockNumber: transaction.ledger_attr,
          timestamp: transaction.created_at,
        };
      } else {
        const provider = new ethers.providers.JsonRpcProvider(this.getChainRpcUrl(chain));
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (!receipt) {
          return {
            confirmed: false,
            status: 'pending',
          };
        }

        return {
          confirmed: receipt.status === 1,
          status: receipt.status === 1 ? 'success' : 'failed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        };
      }
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return {
        confirmed: false,
        status: 'error',
        error: error.message,
      };
    }
  }

  async validateBridgeTransaction(fromChain, toChain, amount, token) {
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

  getChainRpcUrl(chain) {
    const urls = {
      ethereum: process.env.ETHEREUM_RPC_URL,
      base: process.env.BASE_RPC_URL,
      optimism: process.env.OPTIMISM_RPC_URL,
    };
    return urls[chain] || process.env.ETHEREUM_RPC_URL;
  }

  async estimateGasFees(chain, transaction) {
    try {
      if (chain === 'stellar') {
        return {
          fee: '100', // 100 stroops
          estimatedTime: 5, // 5 seconds
        };
      } else {
        const provider = new ethers.providers.JsonRpcProvider(this.getChainRpcUrl(chain));
        const gasPrice = await provider.getGasPrice();
        const gasLimit = await provider.estimateGas(transaction);
        
        return {
          gasPrice: gasPrice.toString(),
          gasLimit: gasLimit.toString(),
          totalFee: gasPrice.mul(gasLimit).toString(),
          estimatedTime: this.getChainConfirmationTime(chain),
        };
      }
    } catch (error) {
      console.error('Gas estimation failed:', error);
      throw new Error('Failed to estimate transaction fees');
    }
  }

  getChainConfirmationTime(chain) {
    const times = {
      ethereum: 900, // 15 minutes
      base: 120,     // 2 minutes
      optimism: 120, // 2 minutes
      stellar: 5,    // 5 seconds
    };
    return times[chain] || 300;
  }
}

export const cactiConnector = new CactiConnector();