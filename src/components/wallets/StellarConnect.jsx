import React, { useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { useStellarWallet } from '../../hooks/useStellarWallet';

const StellarConnect = () => {
  const {
    address,
    isConnected,
    isConnecting,
    error,
    isFreighterAvailable,
    connect,
    disconnect
  } = useStellarWallet();

  useEffect(() => {
    // Check if already connected on component mount
    const checkConnection = async () => {
      if (isFreighterAvailable && !isConnected && !isConnecting) {
        try {
          const isConnected = await window.freighter?.isConnected();
          if (isConnected) {
            await connect();
          }
        } catch (err) {
          console.warn('Connection check failed:', err);
        }
      }
    };
    
    checkConnection();
  }, [isFreighterAvailable, isConnected, isConnecting, connect]);

  const handleConnect = async () => {
    if (!isFreighterAvailable) {
      window.open('https://www.freighter.app/', '_blank');
      return;
    }
    try {
      await connect();
    } catch (err) {
      console.error('Stellar wallet connection error:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Stellar wallet disconnect error:', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isConnecting}
        className={`
          flex items-center px-4 py-2 rounded
          ${isConnected 
            ? 'bg-green-600 hover:bg-green-700' 
            : isConnecting 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'
          }
          text-white font-bold transition-colors duration-200
          ${isConnecting ? 'opacity-75' : ''}
        `}
      >
        <Wallet className={`mr-2 ${isConnecting ? 'animate-spin' : ''}`} size={16} />
        {isConnected 
          ? 'Connected to Stellar'
          : isConnecting 
            ? 'Connecting...' 
            : 'Connect Stellar'
        }
      </button>

      {isConnected && address && (
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

      {!isFreighterAvailable && !isConnected && !error && (
        <div className="text-sm text-yellow-400 max-w-xs text-center p-2 bg-yellow-900 bg-opacity-20 rounded">
          Freighter wallet not detected
        </div>
      )}
    </div>
  );
};

export default StellarConnect;