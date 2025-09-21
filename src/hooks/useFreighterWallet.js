import { useState, useEffect, useCallback } from 'react';
import { checkFreighterInstallation, connectFreighter } from '../services/freighterService';

export const useFreighterWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isInstalled = await checkFreighterInstallation();
        if (isInstalled) {
          const connection = await connectFreighter();
          if (connection.isConnected) {
            setPublicKey(connection.publicKey);
            setIsConnected(true);
          }
        }
      } catch (err) {
        console.warn('Connection check failed:', err);
      }
    };

    checkConnection();
  }, []);

  const connect = useCallback(async () => {
    if (isLoading || isConnected) return;

    setIsLoading(true);
    setError(null);

    try {
      const connection = await connectFreighter();
      setPublicKey(connection.publicKey);
      setIsConnected(true);
      return connection;
    } catch (err) {
      setError(err.message);
      if (err.message.includes('Please install Freighter')) {
        window.open('https://www.freighter.app/', '_blank');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isConnected]);

  const disconnect = useCallback(async () => {
    try {
      setPublicKey(null);
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
    isConnected,
    publicKey,
    isLoading,
    error
  };
};