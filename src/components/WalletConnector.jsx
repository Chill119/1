import React, { useState, useEffect } from 'react';
import WalletButton from './WalletButton';
import metamaskWallet from '../services/wallets/metamask';
import coinbaseWallet from '../services/wallets/coinbase';

const WalletConnector = () => {
  const [metamask, setMetamask] = useState({
    isConnected: false,
    isConnecting: false,
    isInstalling: false,
    address: null,
    error: null
  });

  const [coinbase, setCoinbase] = useState({
    isConnected: false,
    isConnecting: false,
    isInstalling: false,
    address: null,
    error: null
  });

  useEffect(() => {
    // Setup wallet event listeners
    const setupWalletListeners = (wallet, setWalletState) => {
      wallet.on('accountsChanged', (address) => {
        setWalletState(prev => ({ ...prev, address }));
      });

      wallet.on('disconnect', () => {
        setWalletState({
          isConnected: false,
          isConnecting: false,
          isInstalling: false,
          address: null,
          error: null
        });
      });
    };

    setupWalletListeners(metamaskWallet, setMetamask);
    setupWalletListeners(coinbaseWallet, setCoinbase);

    return () => {
      // Cleanup listeners
      metamaskWallet.removeEventListeners();
      coinbaseWallet.removeEventListeners();
    };
  }, []);

  const connectMetaMask = async () => {
    setMetamask(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      if (!metamaskWallet.isInstalled) {
        setMetamask(prev => ({ ...prev, isInstalling: true }));
      }
      const connection = await metamaskWallet.connect();
      setMetamask({
        isConnected: true,
        isConnecting: false,
        isInstalling: false,
        address: connection.address,
        error: null
      });
    } catch (error) {
      setMetamask(prev => ({
        ...prev,
        isConnecting: false,
        isInstalling: false,
        error: error.message
      }));
    }
  };

  const connectCoinbase = async () => {
    setCoinbase(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      if (!coinbaseWallet.isInstalled) {
        setCoinbase(prev => ({ ...prev, isInstalling: true }));
      }
      const connection = await coinbaseWallet.connect();
      setCoinbase({
        isConnected: true,
        isConnecting: false,
        isInstalling: false,
        address: connection.address,
        error: null
      });
    } catch (error) {
      setCoinbase(prev => ({
        ...prev,
        isConnecting: false,
        isInstalling: false,
        error: error.message
      }));
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold mb-4">Connect Wallet</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WalletButton
          label="Connect MetaMask"
          onClick={connectMetaMask}
          isConnecting={metamask.isConnecting}
          isConnected={metamask.isConnected}
          isInstalling={metamask.isInstalling}
          address={metamask.address}
          error={metamask.error}
        />

        <WalletButton
          label="Connect Coinbase Wallet"
          onClick={connectCoinbase}
          isConnecting={coinbase.isConnecting}
          isConnected={coinbase.isConnected}
          isInstalling={coinbase.isInstalling}
          address={coinbase.address}
          error={coinbase.error}
        />
      </div>
    </div>
  );
};

export default WalletConnector;