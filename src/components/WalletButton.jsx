import React from 'react';
import { Wallet } from 'lucide-react';

const WalletButton = ({ 
  onClick, 
  isConnecting, 
  isConnected, 
  isInstalling,
  label, 
  address,
  error 
}) => {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onClick}
        disabled={isConnecting || isInstalling}
        className={`
          flex items-center justify-center px-4 py-2 rounded-lg font-semibold
          transition-all duration-200 gap-2
          ${isConnected 
            ? 'bg-green-600 hover:bg-green-700' 
            : isConnecting || isInstalling
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }
          text-white
        `}
      >
        <Wallet className={isConnecting ? 'animate-spin' : ''} size={20} />
        <span>
          {isConnected 
            ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`
            : isInstalling
              ? 'Installing...'
              : isConnecting
                ? 'Connecting...'
                : label}
        </span>
      </button>

      {error && (
        <p className="text-sm text-red-500 bg-red-100 p-2 rounded">
          {error}
        </p>
      )}
    </div>
  );
};

export default WalletButton;