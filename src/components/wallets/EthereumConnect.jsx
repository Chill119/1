import React, { useState, useCallback } from 'react';
import { Wallet } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const EthereumConnect = () => {
  const { connectWallet, disconnectWallet, ethereumAddress } = useAppContext();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = useCallback(async () => {
    if (isConnecting || ethereumAddress) return;

    try {
      setIsConnecting(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('MetaMask not detected. Please install MetaMask.');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      await connectWallet('ethereum', accounts[0]);
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Ethereum wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [connectWallet, ethereumAddress, isConnecting]);

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnectWallet('ethereum');
    } catch (err) {
      console.error('Ethereum wallet disconnect error:', err);
    }
  }, [disconnectWallet]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={ethereumAddress ? handleDisconnect : handleConnect}
        disabled={isConnecting}
        className={`
          flex items-center px-4 py-2 rounded
          ${ethereumAddress 
            ? 'bg-green-600' 
            : isConnecting 
              ? 'bg-gray-600' 
              : 'bg-blue-600 hover:bg-blue-700'
          }
          text-white font-bold transition-colors duration-200
          ${isConnecting ? 'cursor-not-allowed opacity-75' : ''}
        `}
      >
        <Wallet className="mr-2" size={16} />
        {ethereumAddress 
          ? 'Connected to Ethereum'
          : isConnecting 
            ? 'Connecting...' 
            : 'Connect Ethereum'
        }
      </button>

      {ethereumAddress && (
        <div className="text-sm text-gray-300">
          {ethereumAddress.slice(0, 6)}...{ethereumAddress.slice(-4)}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default EthereumConnect;