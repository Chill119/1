import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { connectEthereumWallet, connectStellarWallet } from '../services/walletService';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [ethereumAddress, setEthereumAddress] = useState(null);
  const [stellarAddress, setStellarAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Check for existing connections on mount
  useEffect(() => {
    checkExistingConnections();
  }, []);

  const checkExistingConnections = async () => {
    try {
      // Check Ethereum connection
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setEthereumAddress(accounts[0]);
        }
      }

      // Check Stellar connection
      if (window.freighter) {
        try {
          const isConnected = await window.freighter.isConnected();
          if (isConnected) {
            const publicKey = await window.freighter.getPublicKey();
            setStellarAddress(publicKey);
          }
        } catch (err) {
          console.warn('Freighter connection check failed:', err);
        }
      }
    } catch (error) {
      console.warn('Connection check failed:', error);
    }
  };

  const connectWallet = useCallback(async (type, address = null) => {
    if (isConnecting) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      let connection;
      
      if (type === 'ethereum') {
        if (address) {
          // Direct address provided
          setEthereumAddress(address);
          connection = { address, type: 'ethereum' };
        } else {
          // Connect via service
          connection = await connectEthereumWallet();
          setEthereumAddress(connection.address);
        }
      } else if (type === 'stellar') {
        if (address) {
          // Direct address provided
          setStellarAddress(address);
          connection = { address, type: 'stellar' };
        } else {
          // Connect via service
          connection = await connectStellarWallet();
          setStellarAddress(connection.address);
        }
      }

      return connection;
    } catch (error) {
      setConnectionError(error.message);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnectWallet = useCallback(async (type) => {
    try {
      if (type === 'ethereum') {
        setEthereumAddress(null);
        // Clear any stored connection state
        localStorage.removeItem('walletconnect');
      } else if (type === 'stellar') {
        setStellarAddress(null);
        // Disconnect from Freighter if available
        if (window.freighter) {
          try {
            await window.freighter.disconnect();
          } catch (err) {
            console.warn('Freighter disconnect warning:', err);
          }
        }
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      setConnectionError(error.message);
    }
  }, []);

  const value = {
    ethereumAddress,
    stellarAddress,
    isConnecting,
    connectionError,
    connectWallet,
    disconnectWallet,
    // Helper methods
    isEthereumConnected: Boolean(ethereumAddress),
    isStellarConnected: Boolean(stellarAddress),
    isAnyWalletConnected: Boolean(ethereumAddress || stellarAddress),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};