import React, { useState, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';
import { Wallet } from 'lucide-react';
import { useFreighterConnect } from '../hooks/useFreighterConnect';
import { WALLET_URLS } from '../utils/constants';

const WalletConnect = () => {
  const { open } = useWeb3Modal();
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { disconnect: disconnectEvm } = useDisconnect();
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isCheckingMetaMask, setIsCheckingMetaMask] = useState(false);

  const {
    connect: connectFreighter,
    disconnect: disconnectFreighter,
    address: stellarAddress,
    isConnected: isStellarConnected,
    isConnecting: isStellarConnecting,
    error: stellarError,
    isFreighterAvailable
  } = useFreighterConnect();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (stellarError) {
      setError(stellarError);
    }
  }, [stellarError]);

  useEffect(() => {
    let checkInterval;
    if (isCheckingMetaMask) {
      checkInterval = setInterval(() => {
        if (window.ethereum?.isMetaMask) {
          setIsCheckingMetaMask(false);
          handleEvmConnect('metamask', true);
        }
      }, 1000);

      const timeout = setTimeout(() => {
        setIsCheckingMetaMask(false);
        clearInterval(checkInterval);
        setError('MetaMask installation timed out. Please refresh the page after installation.');
      }, 120000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [isCheckingMetaMask]);

  const handleWalletClick = () => {
    if (!isEvmConnected && !isStellarConnected) {
      setShowDropdown(!showDropdown);
    }
  };

  const handleEvmConnect = async (walletType, skipChecks = false) => {
    try {
      setSelectedWallet(walletType);
      setError(null);

      if (!skipChecks) {
        const isMetaMask = walletType === 'metamask';
        const isCoinbase = walletType === 'coinbase';

        if (!window.ethereum || 
            (isMetaMask && !window.ethereum.isMetaMask) || 
            (isCoinbase && !window.ethereum.isCoinbaseWallet)) {
          const url = isMetaMask ? WALLET_URLS.ethereum.metamask : WALLET_URLS.ethereum.coinbase;
          if (isMetaMask) {
            setIsCheckingMetaMask(true);
          }
          window.open(url, '_blank');
          return;
        }
      }

      await open();
      setShowDropdown(false);
    } catch (err) {
      console.error('EVM wallet connection error:', err);
      if (!isCheckingMetaMask) {
        setError(err.message);
      }
    } finally {
      if (!isCheckingMetaMask) {
        setSelectedWallet(null);
      }
    }
  };

  const handleStellarConnect = async () => {
    try {
      setError(null);
      setSelectedWallet('stellar');

      if (!isFreighterAvailable) {
        window.open(WALLET_URLS.stellar.freighter, '_blank');
        setError('Please install Freighter wallet extension');
        return;
      }

      await connectFreighter();
      setShowDropdown(false);
    } catch (err) {
      console.error('Stellar wallet connection error:', err);
      setError(err.message);
    } finally {
      setSelectedWallet(null);
    }
  };

  const handleDisconnect = async (type) => {
    try {
      setError(null);
      if (type === 'evm') {
        await disconnectEvm();
      } else {
        await disconnectFreighter();
      }
    } catch (err) {
      console.error('Wallet disconnect error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="relative">
      {!isEvmConnected && !isStellarConnected ? (
        <div>
          <button
            onClick={handleWalletClick}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors duration-200"
          >
            <Wallet className="mr-2" size={20} />
            Connect Wallet
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-50">
              <div className="p-2 space-y-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 px-3 py-1">Ethereum</h3>
                  <button
                    onClick={() => handleEvmConnect('metamask')}
                    disabled={isCheckingMetaMask}
                    className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded-md flex items-center space-x-2"
                  >
                    <Wallet size={16} />
                    <span>
                      {isCheckingMetaMask ? 'Waiting for installation...' : 'MetaMask'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleEvmConnect('coinbase')}
                    className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded-md flex items-center space-x-2"
                  >
                    <Wallet size={16} />
                    <span>Coinbase Wallet</span>
                  </button>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 px-3 py-1">Stellar</h3>
                  <button
                    onClick={handleStellarConnect}
                    disabled={isStellarConnecting}
                    className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded-md flex items-center space-x-2"
                  >
                    <Wallet size={16} />
                    <span>
                      {isStellarConnecting ? 'Connecting...' : 'Freighter'}
                    </span>
                    {!isFreighterAvailable && (
                      <span className="text-xs text-yellow-400">(Install)</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex space-x-4">
          {isEvmConnected && (
            <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
              <span className="text-gray-300">
                {evmAddress?.slice(0, 6)}...{evmAddress?.slice(-4)}
              </span>
              <button
                onClick={() => handleDisconnect('evm')}
                className="text-gray-400 hover:text-red-400 transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>
          )}

          {isStellarConnected && (
            <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
              <span className="text-gray-300">
                {stellarAddress?.slice(0, 6)}...{stellarAddress?.slice(-4)}
              </span>
              <button
                onClick={() => handleDisconnect('stellar')}
                className="text-gray-400 hover:text-red-400 transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="absolute right-0 mt-2 p-3 bg-red-500 text-white text-sm rounded-lg max-w-xs z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;