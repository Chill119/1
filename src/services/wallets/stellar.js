import { Networks, TransactionBuilder, Operation, Asset, BASE_FEE, Keypair } from 'stellar-sdk';
import { WALLET_URLS } from '../../utils/constants';

export class StellarWallet {
  constructor() {
    this.address = null;
    this.isConnected = false;
    this.network = Networks.TESTNET;
    this.networkUrl = 'https://horizon-testnet.stellar.org';
    this.isInstalled = false;
    this.checkWalletInstalled();
  }

  async checkWalletInstalled() {
    try {
      if (typeof window.freighter !== 'undefined') {
        const isAvailable = await window.freighter.isAvailable();
        this.isInstalled = isAvailable;
        return isAvailable;
      }
      return false;
    } catch (error) {
      console.error('Freighter check failed:', error);
      return false;
    }
  }

  async connect() {
    if (!this.isInstalled) {
      window.open(WALLET_URLS.stellar.freighter, '_blank');
      throw new Error('Freighter not installed. Please install and refresh the page.');
    }

    try {
      const connected = await window.freighter.isConnected();
      if (!connected) {
        await window.freighter.connect();
      }

      await window.freighter.setNetwork('TESTNET', {
        networkPassphrase: Networks.TESTNET,
        networkUrl: this.networkUrl,
      });

      const publicKey = await window.freighter.getPublicKey();
      if (!publicKey) {
        throw new Error('Failed to get public key');
      }

      this.address = publicKey;
      this.isConnected = true;

      this.setupEventListeners();

      return {
        address: publicKey,
        network: this.network,
        isConnected: true
      };
    } catch (error) {
      if (error.message?.includes('User rejected')) {
        throw new Error('Connection rejected. Please approve the connection request.');
      }
      throw error;
    }
  }

  async sendPayment(destinationAddress, amount, memo = null) {
    if (!this.isConnected || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch(`${this.networkUrl}/accounts/${this.address}`);
      const accountData = await response.json();

      const account = {
        accountId: () => this.address,
        sequenceNumber: () => accountData.sequence,
        incrementSequenceNumber: () => {
          accountData.sequence = (BigInt(accountData.sequence) + BigInt(1)).toString();
        }
      };

      let transactionBuilder = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: this.network,
      });

      transactionBuilder = transactionBuilder.addOperation(
        Operation.payment({
          destination: destinationAddress,
          asset: Asset.native(),
          amount: amount.toString(),
        })
      );

      if (memo) {
        transactionBuilder = transactionBuilder.addMemo(memo);
      }

      transactionBuilder = transactionBuilder.setTimeout(180);
      const transaction = transactionBuilder.build();

      const xdr = transaction.toXDR();
      const signedXDR = await window.freighter.signTransaction(xdr, this.network);

      const submitResponse = await fetch(`${this.networkUrl}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `tx=${encodeURIComponent(signedXDR)}`,
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.extras?.result_codes?.operations?.join(', ') || 'Transaction failed');
      }

      const result = await submitResponse.json();

      return {
        hash: result.hash,
        ledger: result.ledger,
        success: true,
      };
    } catch (error) {
      console.error('Stellar payment failed:', error);
      throw error;
    }
  }

  async getBalance() {
    if (!this.isConnected || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch(`${this.networkUrl}/accounts/${this.address}`);
      const accountData = await response.json();

      const nativeBalance = accountData.balances.find(
        (balance) => balance.asset_type === 'native'
      );

      return {
        xlm: nativeBalance?.balance || '0',
        balances: accountData.balances,
      };
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      throw error;
    }
  }

  async getTransactionHistory(limit = 10) {
    if (!this.isConnected || !this.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch(
        `${this.networkUrl}/accounts/${this.address}/payments?order=desc&limit=${limit}`
      );
      const data = await response.json();

      return data._embedded.records.map((record) => ({
        id: record.id,
        type: record.type,
        from: record.from,
        to: record.to,
        amount: record.amount,
        asset_type: record.asset_type,
        created_at: record.created_at,
        transaction_hash: record.transaction_hash,
      }));
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (window.freighter) {
        await window.freighter.disconnect();
      }
      this.removeEventListeners();
      this.address = null;
      this.isConnected = false;
    } catch (error) {
      console.error('Disconnect error:', error);
      throw error;
    }
  }

  setupEventListeners() {
    window.addEventListener('freighterDisconnected', this.handleDisconnect);
  }

  removeEventListeners() {
    window.removeEventListener('freighterDisconnected', this.handleDisconnect);
  }

  handleDisconnect = () => {
    this.disconnect();
  };
}

export default new StellarWallet();