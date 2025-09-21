import { ethers } from 'ethers';
import { WALLET_URLS } from '../../utils/constants';

class MetaMaskWallet {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isInstalled = this.checkWalletInstalled();
    this.listeners = new Map();
  }

  checkWalletInstalled() {
    return Boolean(window.ethereum?.isMetaMask);
  }

  async connect() {
    if (!this.isInstalled) {
      window.open(WALLET_URLS.ethereum.metamask, '_blank');
      throw new Error('MetaMask not installed. Please install and refresh the page.');
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request accounts with timeout
      const accounts = await Promise.race([
        provider.send('eth_requestAccounts', []),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 30000)
        )
      ]);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      this.provider = provider;
      this.signer = signer;
      this.address = address;
      this.chainId = network.chainId;

      this.setupEventListeners();

      return {
        address,
        chainId: network.chainId,
        provider,
        signer
      };
    } catch (error) {
      if (error.code === 4001) {
        throw new Error('Connection rejected. Please approve the connection request.');
      }
      if (error.code === -32002) {
        throw new Error('Connection request pending. Please check MetaMask.');
      }
      throw error;
    }
  }

  async disconnect() {
    if (this.provider) {
      this.removeEventListeners();
      this.provider = null;
      this.signer = null;
      this.address = null;
      this.chainId = null;
    }
  }

  async switchNetwork(chainId) {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.toQuantity(chainId) }],
      });
    } catch (error) {
      if (error.code === 4902) {
        throw new Error('Network not added to MetaMask');
      }
      throw error;
    }
  }

  async signMessage(message) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      return await this.signer.signMessage(message);
    } catch (error) {
      if (error.code === 4001) {
        throw new Error('Message signing rejected');
      }
      throw error;
    }
  }

  async signTransaction(transaction) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      return await this.signer.signTransaction(transaction);
    } catch (error) {
      if (error.code === 4001) {
        throw new Error('Transaction signing rejected');
      }
      throw error;
    }
  }

  setupEventListeners() {
    const accountsChanged = (accounts) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else if (this.address !== accounts[0]) {
        this.address = accounts[0];
        this.emit('accountsChanged', accounts[0]);
      }
    };

    const chainChanged = () => {
      this.emit('chainChanged');
      window.location.reload();
    };

    const disconnect = () => {
      this.disconnect();
      this.emit('disconnect');
    };

    window.ethereum.on('accountsChanged', accountsChanged);
    window.ethereum.on('chainChanged', chainChanged);
    window.ethereum.on('disconnect', disconnect);

    this.listeners.set('accountsChanged', accountsChanged);
    this.listeners.set('chainChanged', chainChanged);
    this.listeners.set('disconnect', disconnect);
  }

  removeEventListeners() {
    for (const [event, listener] of this.listeners) {
      window.ethereum.removeListener(event, listener);
    }
    this.listeners.clear();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        callback(data);
      }
    }
  }
}

export default new MetaMaskWallet();