import { useState, useCallback, useEffect } from 'react';
import { isConnected, isAllowed, setAllowed, getPublicKey, getNetwork } from '@stellar/freighter-api';

export const useFreighterConnect = () => {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isFreighterAvailable, setIsFreighterAvailable] = useState(false);

  // Check Freighter availability on mount
  useEffect(() => {
    const checkFreighter = async () => {
      try {
        // Check if Freighter API is available
        const connected = await isConnected();
        setIsFreighterAvailable(true);
        
        if (connected) {
          const allowed = await isAllowed();
          if (allowed) {
            const publicKey = await getPublicKey();
            setAddress(publicKey);
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.warn('Freighter not available:', err);
        setIsFreighterAvailable(false);
      }
    };

    checkFreighter();
  }, []);

  const connect = useCallback(async () => {
    if (isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Check if Freighter is available
      if (!isFreighterAvailable) {
        window.open('https://www.freighter.app/', '_blank');
        throw new Error('Please install Freighter wallet extension');
      }

      // Check if already connected
      const connected = await isConnected();
      if (!connected) {
        // Request connection - this will open Freighter popup
        await setAllowed();
      }

      // Check if user allowed access
      const allowed = await isAllowed();
      if (!allowed) {
        throw new Error('Please allow access to Freighter wallet');
      }

      // Get public key
      const publicKey = await getPublicKey();
      if (!publicKey) {
        throw new Error('Failed to get public key from Freighter');
      }

      // Get network info
      const network = await getNetwork();
      console.log('Connected to network:', network);

      setAddress(publicKey);
      setIsConnected(true);
      return publicKey;
    } catch (err) {
      let errorMessage = 'Failed to connect to Freighter wallet';
      
      if (err.message?.includes('User declined access')) {
        errorMessage = 'Connection rejected by user';
      } else if (err.message?.includes('Freighter is locked')) {
        errorMessage = 'Please unlock Freighter wallet';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isFreighterAvailable]);

  const disconnect = useCallback(async () => {
    try {
      // Note: Freighter doesn't have a programmatic disconnect
      // User needs to disconnect from the extension
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