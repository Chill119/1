import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';

const FreighterAuth = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFreighterDetected, setIsFreighterDetected] = useState(false);

  useEffect(() => {
    const checkFreighter = async () => {
      if (typeof window.freighter !== 'undefined') {
        try {
          const isAvailable = await window.freighter.isAvailable();
          setIsFreighterDetected(isAvailable);
          if (isAvailable) {
            const connected = await window.freighter.isConnected();
            if (connected) {
              const key = await window.freighter.getPublicKey();
              setPublicKey(key);
              setIsConnected(true);
            }
          }
        } catch (err) {
          console.warn('Freighter check warning:', err);
          setIsFreighterDetected(false);
        }
      } else {
        setIsFreighterDetected(false);
      }
    };

    const checkInterval = setInterval(checkFreighter, 1000);
    checkFreighter();

    return () => clearInterval(checkInterval);
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isFreighterDetected) {
        window.open('https://www.freighter.app/', '_blank');
        throw new Error('Please install Freighter wallet and refresh the page');
      }

      await window.freighter.connect();
      const key = await window.freighter.getPublicKey();
      setPublicKey(key);
      setIsConnected(true);
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
      setPublicKey(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (window.freighter && await window.freighter.isAvailable()) {
        await window.freighter.disconnect();
      }
      setIsConnected(false);
      setPublicKey(null);
    } catch (err) {
      console.error('Disconnect error:', err);
      setError('Failed to disconnect. Please try again.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Freighter Wallet Connection</h2>
      
      {!isFreighterDetected && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          Freighter wallet not detected. Please install Freighter to continue.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isConnected ? (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Connected Address:</p>
            <p className="font-mono text-sm">{publicKey}</p>
          </div>
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isLoading || !isFreighterDetected}
          className={`
            w-full px-4 py-2 rounded flex items-center justify-center
            ${isLoading || !isFreighterDetected
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'}
            text-white transition-colors
          `}
        >
          <Wallet className="mr-2" size={20} />
          {isLoading ? 'Connecting...' : 'Connect Freighter Wallet'}
        </button>
      )}
    </div>
  );
};

export default FreighterAuth;