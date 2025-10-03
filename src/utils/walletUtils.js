import { ethers } from 'ethers';
import { Networks } from 'stellar-sdk';
import { WALLET_URLS } from './constants';

export const connectEVMWallet = async (chainType, walletProvider) => {
  if (!window.ethereum) {
    window.open(WALLET_URLS.ethereum.metamask, '_blank');
    throw new Error('No Ethereum wallet detected. Please install MetaMask.');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
      params: []
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No Ethereum accounts found. Please unlock your wallet.');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const account = accounts[0];
    const network = await provider.getNetwork();
    
    return {
      address: account,
      type: chainType,
      provider,
      walletProvider,
      chainId: network.chainId
    };
  } catch (error) {
    if (error.code === -32002) {
      throw new Error('Wallet connection pending. Please check your MetaMask extension.');
    }
    if (error.code === 4001) {
      throw new Error('Wallet connection rejected. Please try again.');
    }
    throw new Error(`Ethereum wallet connection failed: ${error.message}`);
  }
};

export const connectStellarWallet = async (providerId) => {
  // Check if Freighter is injected
  if (typeof window.freighter === 'undefined') {
    window.open(WALLET_URLS.stellar.freighter, '_blank');
    throw new Error('Freighter wallet not detected. Please install Freighter and refresh the page.');
  }

  try {
    // Wait for Freighter to be ready
    const isAvailable = await new Promise((resolve) => {
      let attempts = 0;
      const checkAvailability = async () => {
        try {
          const available = await window.freighter.isAvailable();
          if (available) {
            resolve(true);
          } else if (attempts < 10) {
            attempts++;
            setTimeout(checkAvailability, 500);
          } else {
            resolve(false);
          }
        } catch (err) {
          if (attempts < 10) {
            attempts++;
            setTimeout(checkAvailability, 500);
          } else {
            resolve(false);
          }
        }
      };
      checkAvailability();
    });

    if (!isAvailable) {
      throw new Error('Freighter is installed but not initialized. Please refresh the page or restart your browser.');
    }

    // Check if already connected
    let connected = false;
    try {
      connected = await window.freighter.isConnected();
    } catch (err) {
      console.warn('Connection check failed:', err);
    }
    
    if (!connected) {
      try {
        await window.freighter.connect();
      } catch (connectError) {
        if (connectError.message?.includes('User rejected')) {
          throw new Error('Connection rejected. Please approve the connection request.');
        }
        throw new Error('Failed to connect to Freighter. Please try again.');
      }
    }

    // Get public key with retry logic
    let publicKey;
    let attempts = 0;
    while (!publicKey && attempts < 3) {
      try {
        publicKey = await window.freighter.getPublicKey();
        if (!publicKey) {
          throw new Error('No public key received');
        }
      } catch (err) {
        attempts++;
        if (attempts === 3) {
          throw new Error('Failed to get Stellar public key. Please check wallet permissions.');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Set network with retry
    let networkSet = false;
    attempts = 0;
    while (!networkSet && attempts < 3) {
      try {
        await window.freighter.setNetwork('TESTNET', {
          networkPassphrase: Networks.TESTNET,
          networkUrl: 'https://horizon-testnet.stellar.org',
        });
        networkSet = true;
      } catch (err) {
        attempts++;
        if (attempts === 3) {
          console.warn('Failed to set network:', err);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      address: publicKey,
      type: 'stellar',
      provider: window.freighter,
      walletProvider: providerId,
      network: 'TESTNET'
    };
  } catch (error) {
    throw new Error(`Stellar wallet connection failed: ${error.message}`);
  }
};

export const isWalletConnected = async (type, provider = null) => {
  try {
    if (type === 'stellar') {
      if (typeof window.freighter === 'undefined') return false;
      const isAvailable = await window.freighter.isAvailable();
      if (!isAvailable) return false;
      return await window.freighter.isConnected();
    }

    if (type === 'ethereum') {
      if (!window.ethereum) return false;
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts',
        params: []
      });
      return Boolean(accounts && accounts.length > 0);
    }

    return false;
  } catch (error) {
    console.error(`Wallet connection check failed: ${error.message}`);
    return false;
  }
};

export const disconnectWallet = async (type) => {
  try {
    if (type === 'stellar' && window.freighter) {
      const isAvailable = await window.freighter.isAvailable();
      if (isAvailable) {
        await window.freighter.disconnect();
      }
    }
    return true;
  } catch (error) {
    console.error(`Wallet disconnect failed: ${error.message}`);
    return false;
  }
};

export const getWalletProvider = () => {
  const { ethereum } = window;
  
  if (!ethereum) return null;
  
  if (ethereum.isMetaMask) return 'metamask';
  if (ethereum.isCoinbaseWallet) return 'coinbase';
  
  return null;
};