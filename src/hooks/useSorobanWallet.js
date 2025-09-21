import { useState, useCallback, useEffect } from 'react';
import { Networks } from 'stellar-sdk';

export const useSorobanWallet = () => {
  const [address, setAddress] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isFreighterAvailable, setIsFreighterAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    let checkInterval;

    const checkFreighterAvailability = async () => {
      try {
        if (typeof window.freighter !== 'undefined') {
          const isAvailable = await window.freighter.isAvailable();
          if (mounted) {
            setIsFreighterAvailable(isAvailable);
            if (isAvailable) {
              const isConnected = await window.freighter.isConnected();
              if (isConnected) {
                const publicKey = await window.freighter.getPublicKey();
                setAddress(publicKey);
                setConnected(true);
              }
            }
          }
        } else {
          if (mounted) {
            setIsFreighterAvailable(false);
          }
        }
      } catch (err) {
        console.warn('Freighter check warning:', err);
        if (mounted) {
          setIsFreighterAvailable(false);
        }
      }
    };

    checkFreighterAvailability();
    checkInterval = setInterval(checkFreighterAvailability, 1000);
    
    return () => {
      mounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []);

  const connectWallet = useCallback(async () => {
    if (isConnecting || connected) return;

    setIsConnecting(true);
    setError(null);

    try {
      if (!isFreighterAvailable) {
        throw new Error('Freighter wallet not installed');
      }

      // Ensure Freighter is ready
      const isConnected = await window.freighter.isConnected();
      if (!isConnected) {
        await window.freighter.connect();
      }

      // Set network to testnet with retry logic
      let networkSet = false;
      let attempts = 0;
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
            console.warn('Network setting warning:', err);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Get public key with retry logic
      let publicKey;
      attempts = 0;
      while (!publicKey && attempts < 3) {
        try {
          publicKey = await window.freighter.getPublicKey();
          if (!publicKey) {
            throw new Error('No public key received');
          }
        } catch (err) {
          attempts++;
          if (attempts === 3) {
            throw new Error('Failed to get public key');
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setAddress(publicKey);
      setConnected(true);
      return publicKey;
    } catch (err) {
      let errorMessage = 'Failed to connect wallet';
      
      if (err.message?.includes('User rejected')) {
        errorMessage = 'Connection rejected by user';
      } else if (err.message?.includes('not installed')) {
        errorMessage = 'Please install Freighter wallet';
      }

      setError(errorMessage);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [connected, isConnecting, isFreighterAvailable]);

  const disconnectWallet = useCallback(async () => {
    try {
      setError(null);
      
      if (window.freighter && await window.freighter.isAvailable()) {
        await window.freighter.disconnect();
      }
      
      setAddress(null);
      setConnected(false);
    } catch (err) {
      setError('Failed to disconnect wallet');
      throw err;
    }
  }, []);

  return {
    address,
    connected,
    isConnecting,
    error,
    isFreighterAvailable,
    connectWallet,
    disconnectWallet
  };
};