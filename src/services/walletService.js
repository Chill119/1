import { ethers } from 'ethers';

export const connectEthereumWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }

    // Clear any existing listeners
    if (window.ethereum.removeAllListeners) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }

    const accounts = await Promise.race([
      window.ethereum.request({ method: 'eth_requestAccounts' }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 30000)
      )
    ]);

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask.');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const network = await provider.getNetwork();

    // Set up event listeners
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
      type: 'ethereum',
      connected: true
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
    // Check if Freighter is available
    if (typeof window.freighter === 'undefined') {
      window.open('https://www.freighter.app/', '_blank');
      throw new Error('Please install Freighter wallet to continue. After installation, refresh the page.');
    }

    // Wait for Freighter to be ready
    const checkFreighterAvailability = async (retries = 5, interval = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          const isAvailable = await window.freighter.isAvailable();
          if (isAvailable) return true;
        } catch (err) {
          // Continue trying
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      return false;
    };

    const isAvailable = await checkFreighterAvailability();
    if (!isAvailable) {
      throw new Error('Freighter wallet is not ready. Please refresh the page and try again.');
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

    // Set network (optional, continue if fails)
    try {
      await window.freighter.setNetwork('TESTNET');
    } catch (err) {
      console.warn('Network setting warning:', err);
    }

    return {
      address: publicKey,
      type: 'stellar',
      network: 'TESTNET',
      connected: true
    };
  } catch (error) {
    console.error('Stellar connection details:', {
      freighterExists: typeof window.freighter !== 'undefined',
      error: error.message
    });
    throw error;
  }
};

export const isWalletConnected = async (type) => {
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
        method: 'eth_accounts'
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