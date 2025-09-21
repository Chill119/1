import { useState, useCallback } from 'react';
import ethereumWallet from '../services/wallets/ethereum';
import baseWallet from '../services/wallets/base';
import polygonWallet from '../services/wallets/polygon';
import stellarWallet from '../services/wallets/stellar';

export const useWalletConnection = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [connectedWallets, setConnectedWallets] = useState({
    ethereum: null,
    base: null,
    polygon: null,
    stellar: null
  });

  const connect = useCallback(async (protocol) => {
    if (isConnecting) return;

    setIsConnecting(true);
    setError(null);

    try {
      let connection;
      switch (protocol) {
        case 'ethereum':
          connection = await ethereumWallet.connect();
          break;
        case 'base':
          connection = await baseWallet.connect();
          break;
        case 'polygon':
          connection = await polygonWallet.connect();
          break;
        case 'stellar':
          connection = await stellarWallet.connect();
          break;
        default:
          throw new Error(`Unsupported protocol: ${protocol}`);
      }

      setConnectedWallets(prev => ({
        ...prev,
        [protocol]: connection
      }));

      return connection;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnect = useCallback(async (protocol) => {
    try {
      switch (protocol) {
        case 'ethereum':
          await ethereumWallet.disconnect();
          break;
        case 'base':
          await baseWallet.disconnect();
          break;
        case 'polygon':
          await polygonWallet.disconnect();
          break;
        case 'stellar':
          await stellarWallet.disconnect();
          break;
        default:
          throw new Error(`Unsupported protocol: ${protocol}`);
      }

      setConnectedWallets(prev => ({
        ...prev,
        [protocol]: null
      }));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  return {
    connect,
    disconnect,
    isConnecting,
    error,
    connectedWallets,
    clearError: () => setError(null)
  };
};