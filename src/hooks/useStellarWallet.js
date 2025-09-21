import { useState, useCallback, useEffect } from 'react';
import { Networks } from 'stellar-sdk';
import { WALLET_URLS } from '../utils/constants';

export const useStellarWallet = () => {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isFreighterAvailable, setIsFreighterAvailable] = useState(false);

  // Check Freighter availability and connection status
  useEffect(() => {
    let mounted = true;
    let checkInterval;

    const checkFreighterStatus = async () => {
      try {
        if (typeof window.freighter !== 'undefined') {
          const isAvailable = await window.freighter.isAvailable();
          if (!mounted) return;

          setIsFreighterAvailable(isAvailable);
          if (isAvailable) {
            const connected = await window.freighter.isConnected();
            if (connected) {
              const publicKey = await window.freighter.getPublicKey();
              setAddress(publicKey);
              setIsConnected(true);
            }
          }
        } else {
          if (mounted) {
            setIsFreighterAvailable(false);
          }
        }
      } catch (err) {
        console.warn('Freighter status check warning:', err);
        if (mounted) {
          setIsFreighterAvailable(false);
        }
      }
    };

    checkFreighterStatus();
    checkInterval = setInterval(checkFreighterStatus, 1000);

    return () => {
      mounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []);

  const connect = useCallback(async () => {
    if (isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      if (typeof window.freighter === 'undefined') {
        window.open(WALLET_URLS.stellar.freighter, '_blank');
        throw new Error('Please install Freighter wallet');
      }

      // Wait for Freighter to be ready
      const isAvailable = await new Promise((resolve) => {
        let attempts = 0;
        const checkAvailability = async () => {
          try {
            const available = await window.freighter.isAvailable();
            if (available) {
              resolve(true);
            } else if (attempts < 5) {
              attempts++;
              setTimeout(checkAvailability, 1000);
            } else {
              resolve(false);
            }
          } catch (err) {
            if (attempts < 5) {
              attempts++;
              setTimeout(checkAvailability, 1000);
            } else {
              resolve(false);
            }
          }
        };
        checkAvailability();
      });

      if (!isAvailable) {
        throw new Error('Freighter is not ready. Please refresh the page.');
      }

      // Connect to Freighter
      const connected = await window.freighter.isConnected();
      if (!connected) {
        await window.freighter.connect();
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
            throw new Error('Failed to get public key');
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Set network with retry logic
      attempts = 0;
      let networkSet = false;
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

      setAddress(publicKey);
      setIsConnected(true);
      return publicKey;
    } catch (err) {
      let errorMessage = 'Failed to connect wallet';
      
      if (err.message?.includes('User rejected')) {
        errorMessage = 'Connection rejected by user';
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnect = useCallback(async () => {
    try {
      if (window.freighter && await window.freighter.isAvailable()) {
        await window.freighter.disconnect();
      }
      setAddress(null);
      setIsConnected(false);
      setError(null);
    } catch (err) {
      setError('Failed to disconnect wallet');
      throw err;
    }
  }, []);

  return {
    connect,
    disconnect,
    address,
    isConnected,
    isConnecting,
    error,
    isFreighterAvailable
  };
};