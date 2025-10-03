import { ethers } from 'ethers';
import { WALLET_URLS } from '../../utils/constants';

export class EthereumWallet {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isInstalled = this.checkWalletInstalled();
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
      await provider.send('eth_requestAccounts', []);

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
      throw error;
    }
  }

  async sendTransaction(toAddress, amount) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount.toString()),
        gasLimit: 21000,
      });

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        wait: () => tx.wait(),
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  async getBalance(address = null) {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    const targetAddress = address || this.address;
    if (!targetAddress) {
      throw new Error('No address available');
    }

    try {
      const balance = await this.provider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      throw error;
    }
  }

  async getGasPrice() {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      };
    } catch (error) {
      console.error('Failed to fetch gas price:', error);
      throw error;
    }
  }

  async estimateGas(toAddress, amount) {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const gasEstimate = await this.provider.estimateGas({
        to: toAddress,
        value: ethers.parseEther(amount.toString()),
      });

      const feeData = await this.provider.getFeeData();
      const gasCost = gasEstimate * (feeData.gasPrice || BigInt(0));

      return {
        gasLimit: gasEstimate.toString(),
        gasCostWei: gasCost.toString(),
        gasCostEth: ethers.formatEther(gasCost),
      };
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }

  async getTransactionReceipt(txHash) {
    if (!this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error('Failed to get transaction receipt:', error);
      throw error;
    }
  }

  async switchChain(chainId) {
    if (!window.ethereum) {
      throw new Error('MetaMask not available');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error) {
      if (error.code === 4902) {
        throw new Error('Chain not added to wallet');
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

  setupEventListeners() {
    window.ethereum.on('accountsChanged', this.handleAccountsChanged);
    window.ethereum.on('chainChanged', this.handleChainChanged);
    window.ethereum.on('disconnect', this.handleDisconnect);
  }

  removeEventListeners() {
    window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', this.handleChainChanged);
    window.ethereum.removeListener('disconnect', this.handleDisconnect);
  }

  handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      this.disconnect();
    } else if (this.address !== accounts[0]) {
      this.address = accounts[0];
    }
  };

  handleChainChanged = () => {
    window.location.reload();
  };

  handleDisconnect = () => {
    this.disconnect();
  };
}

export default new EthereumWallet();