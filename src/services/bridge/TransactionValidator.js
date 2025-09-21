import StellarSdk from 'stellar-sdk';
import { ethers } from 'ethers';

export class TransactionValidator {
  constructor() {
    this.stellarServer = new StellarSdk.Server('https://horizon-testnet.stellar.org');
  }

  async validateStellarTransaction(txHash, expectedAmount, expectedRecipient) {
    try {
      const transaction = await this.stellarServer.transactions()
        .transaction(txHash)
        .call();

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Get operations for this transaction
      const operations = await this.stellarServer.operations()
        .forTransaction(txHash)
        .call();

      const paymentOp = operations.records.find(op => op.type === 'payment');

      if (!paymentOp) {
        throw new Error('No payment operation found');
      }

      if (paymentOp.to !== expectedRecipient) {
        throw new Error('Recipient mismatch');
      }

      if (parseFloat(paymentOp.amount) !== parseFloat(expectedAmount)) {
        throw new Error('Amount mismatch');
      }

      return {
        valid: true,
        confirmed: transaction.successful,
        amount: paymentOp.amount,
        recipient: paymentOp.to,
        asset: paymentOp.asset_type === 'native' ? 'XLM' : paymentOp.asset_code,
        ledger: transaction.ledger_attr,
        timestamp: transaction.created_at,
      };
    } catch (error) {
      console.error('Stellar transaction validation failed:', error);
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  async validateEthereumTransaction(txHash, expectedAmount, expectedRecipient, chainRpcUrl) {
    try {
      const provider = new ethers.providers.JsonRpcProvider(chainRpcUrl);
      const transaction = await provider.getTransaction(txHash);
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!transaction || !receipt) {
        throw new Error('Transaction not found');
      }

      if (transaction.to.toLowerCase() !== expectedRecipient.toLowerCase()) {
        throw new Error('Recipient mismatch');
      }

      const expectedValue = ethers.utils.parseEther(expectedAmount.toString());
      if (!transaction.value.eq(expectedValue)) {
        throw new Error('Amount mismatch');
      }

      return {
        valid: true,
        confirmed: receipt.status === 1,
        amount: ethers.utils.formatEther(transaction.value),
        recipient: transaction.to,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber,
        timestamp: new Date(receipt.blockNumber * 15000).toISOString(), // Approximate timestamp
      };
    } catch (error) {
      console.error('Ethereum transaction validation failed:', error);
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  async validateCrossChainBridge(bridgeData) {
    try {
      const { fromChain, toChain, stellarTxHash, targetTxHash, sourceTxHash } = bridgeData;

      const validations = [];

      // Validate source transaction
      if (fromChain === 'stellar' && stellarTxHash) {
        validations.push(
          this.validateStellarTransaction(
            stellarTxHash,
            bridgeData.lockAmount,
            process.env.BRIDGE_STELLAR_ADDRESS
          )
        );
      } else if (sourceTxHash) {
        validations.push(
          this.validateEthereumTransaction(
            sourceTxHash,
            bridgeData.lockAmount,
            process.env.BRIDGE_EVM_ADDRESS,
            this.getChainRpcUrl(fromChain)
          )
        );
      }

      // Validate target transaction
      if (toChain === 'stellar' && stellarTxHash) {
        validations.push(
          this.validateStellarTransaction(
            stellarTxHash,
            bridgeData.releaseAmount,
            bridgeData.toAddress
          )
        );
      } else if (targetTxHash) {
        validations.push(
          this.validateEthereumTransaction(
            targetTxHash,
            bridgeData.releaseAmount,
            bridgeData.toAddress,
            this.getChainRpcUrl(toChain)
          )
        );
      }

      const results = await Promise.allSettled(validations);
      
      return {
        valid: results.every(r => r.status === 'fulfilled' && r.value.valid),
        confirmed: results.every(r => r.status === 'fulfilled' && r.value.confirmed),
        validations: results.map(r => r.status === 'fulfilled' ? r.value : { valid: false, error: r.reason }),
      };
    } catch (error) {
      console.error('Cross-chain validation failed:', error);
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  async validateBridgeIntegrity(bridgeId, bridgeData) {
    try {
      // Check that amounts match expected conversion rates
      const expectedReleaseAmount = this.calculateExpectedAmount(
        bridgeData.lockAmount,
        bridgeData.token,
        bridgeData.fromChain,
        bridgeData.toChain
      );

      const amountTolerance = 0.001; // 0.1% tolerance for conversion rates
      const amountDiff = Math.abs(bridgeData.releaseAmount - expectedReleaseAmount);
      const amountValid = amountDiff <= (expectedReleaseAmount * amountTolerance);

      // Verify transaction timing
      const timingValid = await this.validateTransactionTiming(bridgeData);

      // Check for double spending
      const doubleSpendCheck = await this.checkDoubleSpending(bridgeData);

      return {
        bridgeId,
        amountValid,
        timingValid,
        doubleSpendCheck,
        integrityScore: [amountValid, timingValid, doubleSpendCheck].filter(Boolean).length / 3,
      };
    } catch (error) {
      console.error('Bridge integrity validation failed:', error);
      return {
        bridgeId,
        integrityScore: 0,
        error: error.message,
      };
    }
  }

  calculateExpectedAmount(amount, token, fromChain, toChain) {
    // Use the same conversion logic as BridgeService
    const rates = {
      'XLM-ETH': 0.00003,
      'ETH-XLM': 33333,
      'USDC-USDC': 1,
    };

    const fromToken = this.getChainToken(fromChain);
    const toToken = this.getChainToken(toChain);
    const conversionKey = `${fromToken}-${toToken}`;
    const rate = rates[conversionKey] || 1;

    return parseFloat(amount) * rate;
  }

  async validateTransactionTiming(bridgeData) {
    try {
      // Check that transactions occurred within reasonable time window
      const maxTimeDiff = 600000; // 10 minutes
      const currentTime = Date.now();
      const bridgeTime = bridgeData.timestamp;

      return (currentTime - bridgeTime) <= maxTimeDiff;
    } catch (error) {
      console.error('Timing validation failed:', error);
      return false;
    }
  }

  async checkDoubleSpending(bridgeData) {
    try {
      // Check if the same source transaction has been used in multiple bridges
      const duplicateBridges = Array.from(bridgeService.bridgeTransactions.values())
        .filter(bridge => 
          bridge.bridgeId !== bridgeData.bridgeId &&
          (bridge.stellarTxHash === bridgeData.stellarTxHash ||
           bridge.sourceTxHash === bridgeData.sourceTxHash)
        );

      return duplicateBridges.length === 0;
    } catch (error) {
      console.error('Double spend check failed:', error);
      return false;
    }
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
}

export const transactionValidator = new TransactionValidator();