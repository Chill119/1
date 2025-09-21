import React, { useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { useSorobanWallet } from '../hooks/useSorobanWallet';

const SorobanConnect = () => {
  const {
    address,
    connected,
    isConnecting,
    error,
    isFreighterAvailable,
    connectWallet,
    disconnectWallet
  } = useSorobanWallet();

  useEffect(() => {
    // Check if already connected on component mount
    const checkConnection = async () => {
      if (isFreighterAvailable && !connected && !isConnecting) {
        try {
          const isConnected = await window.freighter?.isConnected();
          if (isConnected) {
            await connectWallet();
          }
        } catch (err) {
          console.warn('Connection check failed:', err);
        }
      }
    };
    
    checkConnection();
  }, [isFreighterAvailable, connected, isConnecting, connectWallet]);

  const handleConnect = async () => {
    if (!isFreighterAvailable) {
      window.open('https://www.freighter.app/', '_blank');
      return;
    }
    try {
      await connectWallet();
    } catch (err) {
      console.error('Soroban wallet connection error:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (err) {
      console.error('Soroban wallet disconnect error:', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={connected ? handleDisconnect : handleConnect}
        disabled={isConnecting}
        className={`
          flex items-center px-4 py-2 rounded
          ${connected 
            ? 'bg-green-600 hover:bg-green-700' 
            : isConnecting 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }
          text-white font-bold transition-colors duration-200
          ${isConnecting ? 'opacity-75' : ''}
        `}
      >
        <Wallet className={`mr-2 ${isConnecting ? 'animate-spin' : ''}`} size={16} />
        {connected 
          ? 'Connected to Soroban'
          : isConnecting 
            ? 'Connecting...' 
            : 'Connect Soroban'
        }
      </button>

      {connected && address && (
        <div className="text-sm text-gray-300 bg-gray-800 px-4 py-2 rounded-lg">
          <span className="font-medium">Account: </span>
          <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 max-w-xs text-center p-2 bg-red-900 bg-opacity-20 rounded">
          {error}
        </div>
      )}

      {!isFreighterAvailable && !connected && !error && (
        <div className="text-sm text-yellow-400 max-w-xs text-center p-2 bg-yellow-900 bg-opacity-20 rounded">
          Freighter wallet not detected
        </div>
      )}
    </div>
  );
};

export default SorobanConnect;