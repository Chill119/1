import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [ethereumAddress, setEthereumAddress] = useState(null);
  const [stellarAddress, setStellarAddress] = useState(null);

  const connectWallet = useCallback((type, address) => {
    if (type === 'ethereum') {
      setEthereumAddress(address);
    } else if (type === 'stellar') {
      setStellarAddress(address);
    }
  }, []);

  const disconnectWallet = useCallback((type) => {
    if (type === 'ethereum') {
      setEthereumAddress(null);
    } else if (type === 'stellar') {
      setStellarAddress(null);
    }
  }, []);

  const value = {
    ethereumAddress,
    stellarAddress,
    connectWallet,
    disconnectWallet
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