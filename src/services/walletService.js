import { ethers } from 'ethers';
import StellarSdk from 'stellar-sdk';

export const connectEthereumWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');

    const accounts = await Promise.race([
      window.ethereum.request({ method: 'eth_requestAccounts' }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 30000)
      )
    ]);

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask.');
    }

    const signer = provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    window.ethereum.on('accountsChanged', (newAccounts) => {
      if (!newAccounts.length) {
        window.location.reload();
      }
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });

    return {
      address,
      chainId: network.chainId,
      provider,
      signer,
      type: 'ethereum'
    };
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('Connection rejected. Please approve the connection.');
    }
    if (error.code === -32002) {
      throw new Error('Connection already pending. Check MetaMask.');
    }
    throw error;
  }
};

export const connectStellarWallet = async () => {
  try {
    // Check if Freighter is defined in window object
    if (typeof window.freighter === 'undefined') {
      // Open Freighter installation page in a new tab
      window.open('https://www.freighter.app/', '_blank');
      throw new Error('Please install Freighter wallet to continue. After installation, refresh the page.');
    }

    // Wait for Freighter to be ready
    const checkFreighterAvailability = async (retries = 5, interval = 1000) => {
      for (let i = 0; i < retries; i++) {
        const isAvailable = await window.freighter?.isAvailable();
        if (isAvailable) return true;
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      return false;
    };

    const isAvailable = await checkFreighterAvailability();
    if (!isAvailable) {
      throw new Error('Freighter wallet is not ready. Please refresh and try again.');
    }

    // Initialize Stellar SDK server
    const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

    // Connect to Freighter
    try {
      await window.freighter.connect();
    } catch (err) {
      if (err.message?.includes('User rejected')) {
        throw new Error('Connection rejected. Please approve the connection request.');
      }
      throw new Error('Failed to connect to Freighter. Please try again.');
    }

    // Get public key with timeout
    let publicKey;
    try {
      publicKey = await Promise.race([
        window.freighter.getPublicKey(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 15000)
        )
      ]);
    } catch (err) {
      throw new Error('Failed to retrieve wallet address. Please try again.');
    }

    if (!publicKey) {
      throw new Error('No wallet address found. Please check Freighter wallet.');
    }

    // Verify account exists
    try {
      await server.loadAccount(publicKey);
    } catch (err) {
      if (err.response?.status === 404) {
        throw new Error('Account not found on Stellar network. Please fund your account first.');
      }
      throw new Error('Failed to verify account. Please try again.');
    }

    // Set network
    try {
      await window.freighter.setNetwork('TESTNET', {
        networkPassphrase: StellarSdk.Networks.TESTNET,
        networkUrl: 'https://horizon-testnet.stellar.org',
      });
    } catch (err) {
      console.warn('Network setting warning:', err);
      // Continue even if network setting fails
    }

    // Setup disconnect handler
    window.addEventListener('freighterDisconnected', () => {
      window.location.reload();
    });

    return {
      address: publicKey,
      type: 'stellar',
      network: 'TESTNET',
      connected: true,
      server
    };
  } catch (error) {
    console.error('Stellar connection details:', {
      freighterExists: typeof window.freighter !== 'undefined',
      error: error.message
    });
    throw error;
  }
};