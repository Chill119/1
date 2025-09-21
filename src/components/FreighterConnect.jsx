import React, { useEffect } from 'react';
import { Wallet, ExternalLink } from 'lucide-react';
import { useFreighterConnect } from '../hooks/useFreighterConnect';

const FreighterConnect = () => {
  const { connect, disconnect, isConnected, address, isConnecting, error, isFreighterAvailable } = useFreighterConnect();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  const handleInstallFreighter = () => {
    window.open('https://www.freighter.app/', '_blank');
  };

  if (!isFreighterAvailable) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="text-center p-4 bg-yellow-900 bg-opacity-20 rounded-lg border border-yellow-600">
          <p className="text-yellow-400 mb-2">Freighter wallet not detected</p>
          <button
            onClick={handleInstallFreighter}
            className="flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors duration-200"
          >
            <ExternalLink className="mr-2" size={16} />
            Install Freighter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={isConnected ? handleDisconnect : handleConnect}
        disabled={isConnecting}
        className={`
          flex items-center px-4 py-2 rounded-lg font-semibold transition-colors duration-200
          ${isConnected 
            ? 'bg-green-600 hover:bg-green-700' 
            : isConnecting 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }
          text-white
        `}
      >
        <Wallet className={`mr-2 ${isConnecting ? 'animate-spin' : ''}`} size={20} />
        {isConnected 
          ? 'Disconnect Freighter'
          : isConnecting 
            ? 'Connecting...' 
            : 'Connect Freighter'
        }
      </button>

      {isConnected && address && (
        <div className="bg-gray-800 px-4 py-2 rounded-lg">
          <p className="text-sm text-gray-300">
            Connected: <span className="font-mono text-green-400">{address.slice(0, 6)}...{address.slice(-4)}</span>
          </p>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-900 bg-opacity-20 px-4 py-2 rounded-lg max-w-xs text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default FreighterConnect;