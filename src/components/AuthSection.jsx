import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Wallet } from 'lucide-react';
import { connectEthereumWallet, connectStellarWallet } from '../services/walletService';

const AuthSection = () => {
  const { connectWallet, connected, disconnectWallet } = useAppContext();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [activeWallet, setActiveWallet] = useState(null);
  const [connectionTimeout, setConnectionTimeout] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
    };
  }, [connectionTimeout]);

  // Reset connection state after error
  useEffect(() => {
    if (connectionError) {
      const timer = setTimeout(() => {
        setConnectionError(null);
        setIsConnecting(false);
        setActiveWallet(null);
      }, 5000);
      setConnectionTimeout(timer);
      return () => clearTimeout(timer);
    }
  }, [connectionError]);

  const resetConnectionState = useCallback(() => {
    setIsConnecting(false);
    setConnectionError(null);
    setActiveWallet(null);
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      setConnectionTimeout(null);
    }
  }, [connectionTimeout]);

  const handleWalletConnect = async (walletType) => {
    // If already connecting, cancel the current attempt
    if (isConnecting) {
      resetConnectionState();
      return;
    }
    
    // If already connected to this wallet type, do nothing
    if (connected && activeWallet === walletType) {
      return;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    setActiveWallet(walletType);
    
    // Set a connection timeout
    const timeout = setTimeout(() => {
      resetConnectionState();
      setConnectionError('Connection attempt timed out. Please try again.');
    }, 30000); // 30 second timeout
    setConnectionTimeout(timeout);
    
    try {
      // If connected to a different wallet, disconnect first
      if (connected) {
        await disconnectWallet();
      }

      const connection = await (walletType === 'ethereum' 
        ? connectEthereumWallet()
        : connectStellarWallet());

      if (connection.connected) {
        await connectWallet(walletType, connection);
        
        // For Stellar, verify the connection
        if (walletType === 'stellar' && window.freighter) {
          const message = 'Sign this message to verify wallet access';
          await window.freighter.signMessage(message);
        }
        
        resetConnectionState();
      }
    } catch (error) {
      // Handle specific error cases
      let errorMessage = error.message;
      
      if (error.code === -32002) {
        errorMessage = 'Wallet connection already pending. Please check your wallet.';
      } else if (error.code === 4001) {
        errorMessage = 'Connection rejected. Please try again.';
      }
      
      setConnectionError(errorMessage);
      
      // If connected to Stellar, ensure proper cleanup
      if (walletType === 'stellar' && window.freighter) {
        try {
          await window.freighter.disconnect();
        } catch (cleanupError) {
          console.warn('Cleanup warning:', cleanupError);
        }
      }
      
      resetConnectionState();
    } finally {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        setConnectionTimeout(null);
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
      
      <div className="flex flex-col md:flex-row gap-4">
        <WalletButton
          onClick={() => handleWalletConnect('ethereum')}
          disabled={connected && activeWallet !== 'ethereum'}
          isConnecting={isConnecting && activeWallet === 'ethereum'}
          isActive={connected && activeWallet === 'ethereum'}
          label="Connect Ethereum"
          className="bg-blue-600 hover:bg-blue-700"
        />

        <WalletButton
          onClick={() => handleWalletConnect('stellar')}
          disabled={connected && activeWallet !== 'stellar'}
          isConnecting={isConnecting && activeWallet === 'stellar'}
          isActive={connected && activeWallet === 'stellar'}
          label="Connect Stellar"
          className="bg-purple-600 hover:bg-purple-700"
        />
      </div>

      {connectionError && (
        <div className="mt-4 p-3 bg-red-500 bg-opacity-90 text-white rounded-lg text-sm">
          {connectionError}
        </div>
      )}
    </div>
  );
};

const WalletButton = ({ onClick, disabled, isConnecting, isActive, label, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex items-center px-6 py-3 rounded-lg transition-all duration-200
      ${disabled ? 'bg-gray-600 cursor-not-allowed' : className}
      ${isActive ? 'ring-2 ring-green-400' : ''}
      text-white font-semibold min-w-[200px] justify-center
      ${isConnecting ? 'animate-pulse' : ''}
    `}
  >
    <Wallet className={`mr-2 ${isConnecting ? 'animate-spin' : ''}`} size={20} />
    {isConnecting ? 'Connecting...' : isActive ? 'Connected' : label}
  </button>
);

export default AuthSection;