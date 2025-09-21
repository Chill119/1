import React from 'react';
import { Wallet, ChevronDown } from 'lucide-react';

const WalletButton = ({ onClick, isConnecting, showDropdown }) => {
  return (
    <button
      onClick={onClick}
      disabled={isConnecting}
      className={`
        flex items-center px-4 py-2 rounded-lg font-bold transition-colors duration-200
        ${isConnecting 
          ? 'bg-gray-600 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700'
        }
        text-white
      `}
    >
      <Wallet className={`mr-2 ${isConnecting ? 'animate-spin' : ''}`} size={20} />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      <ChevronDown 
        className={`ml-2 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
        size={16} 
      />
    </button>
  );
};

export default WalletButton;