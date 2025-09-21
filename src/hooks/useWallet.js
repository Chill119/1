import { useState, useCallback, useEffect } from 'react';
import metamaskWallet from '../services/wallets/metamask';
import coinbaseWallet from '../services/wallets/coinbase';

export const useWallet = (walletType) => {
  const [state, setState] = useState({
    isConnected: false,
    isConnecting: false,
    isInstalling: false,
    address: null,
    chainId: null,
    error: null
  });

  const wallet = walletType === 'metamask' ? metamaskWallet : coinbaseWallet;

  useEffect(() => {
    const setupListeners = () => {
      wallet.on('accountsChanged', (address) => {
        setState(prev => ({ ...prev, address }));
      });

      wallet.on('chainChanged', () => {
        window.location.reload();
      });

      wallet.on('disconnect', () => {
        setState({
          isConnected: false,
          isConnecting: false,
          isInstalling: false,
          address: null,
          chainId: null,
          error: null
        });
      });
    };

    setupListeners();

    return () => {
      wallet.removeEventListeners();
    };
  }, [wallet]);

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      if (!wallet.isInstalled) {
        setState(prev => ({ ...prev, isInstalling: true }));
      }
      const connection = await wallet.connect();
      setState({
        isConnected: true,
        isConnecting: false,
        isInstalling: false,
        address: connection.address,
        chainId: connection.chainId,
        error: null
      });
      return connection;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        isInstalling: false,
        error: error.message
      }));
      throw error;
    }
  }, [wallet]);

  const disconnect = useCallback(async () => {
    try {
      await wallet.disconnect();
      setState({
        isConnected: false,
        isConnecting: false,
        isInstalling: false,
        address: null,
        chainId: null,
        error: null
      });
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [wallet]);

  const signMessage = useCallback(async (message) => {
    try {
      return await wallet.signMessage(message);
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [wallet]);

  const signTransaction = useCallback(async (transaction) => {
    try {
      return await wallet.signTransaction(transaction);
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  }, [wallet]);

  return {
    ...state,
    connect,
    disconnect,
    signMessage,
    signTransaction
  };
};