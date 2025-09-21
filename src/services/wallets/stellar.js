import { Networks } from 'stellar-sdk';
import { WALLET_URLS } from '../../utils/constants';

export class StellarWallet {
  constructor() {
    this.address = null;
    this.isConnected = false;
    this.network = Networks.TESTNET;
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

      // Set network
      await window.freighter.setNetwork('TESTNET', {
        networkPassphrase: Networks.TESTNET,
        networkUrl: 'https://horizon-testnet.stellar.org',
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