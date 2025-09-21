import { ethers } from 'ethers';
import { WALLET_URLS, CHAIN_IDS } from '../../utils/constants';

export class BaseWallet {
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
      
      // Switch to Base network
      await this.switchToBase();
      
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

  async switchToBase() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_IDS.base }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: CHAIN_IDS.base,
            chainName: 'Base',
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: [process.env.BASE_RPC_URL],
            blockExplorerUrls: ['https://basescan.org']
          }],
        });
      } else {
        throw switchError;
      }
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

export default new BaseWallet();