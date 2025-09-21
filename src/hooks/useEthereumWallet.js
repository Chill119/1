import { useState, useEffect } from 'react';

export const useEthereumWallet = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Disconnect wallet on page load/refresh
  useEffect(() => {
    const disconnect = async () => {
      if (window.ethereum) {
        try {
          // Clear local storage
          localStorage.removeItem('walletconnect');
          localStorage.removeItem('WALLET_TYPE');
          localStorage.removeItem('WALLET_CONNECTED');

          // Reset accounts
          await window.ethereum.request({
            method: 'eth_accounts',
            params: []
          });

          // Clear MetaMask connection cache
          if (window.ethereum._state && window.ethereum._state.accounts) {
            window.ethereum._state.accounts = [];
          }

          window.ethereum.emit('disconnect');
        } catch (error) {
          console.warn('Disconnect on load warning:', error);
        }
      }
    };

    disconnect();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      return {
        type: 'ethereum',
        address: accounts[0],
        connected: true
      };
    } catch (error) {
      if (error.code === 4001) {
        throw new Error('Connection rejected by user');
      }
      if (error.code === -32002) {
        throw new Error('Connection pending. Check MetaMask');
      }
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    if (!window.ethereum || isDisconnecting) return false;

    try {
      setIsDisconnecting(true);

      // Clear local storage
      localStorage.removeItem('walletconnect');
      localStorage.removeItem('WALLET_TYPE');
      localStorage.removeItem('WALLET_CONNECTED');

      // Reset accounts
      await window.ethereum.request({
        method: 'eth_accounts',
        params: []
      });

      // Clear MetaMask connection cache
      if (window.ethereum._state && window.ethereum._state.accounts) {
        window.ethereum._state.accounts = [];
      }

      window.ethereum.emit('disconnect');

      return true;
    } catch (error) {
      if (error.code === 4001) {
        return true;
      }
      console.error('Disconnect error:', error);
      return false;
    } finally {
      setIsDisconnecting(false);
    }
  };

  return {
    connectWallet,
    disconnectWallet,
    isConnecting,
    isDisconnecting
  };
};