import React from 'react';
import { Wallet } from 'lucide-react';

const WalletDropdown = ({ onSelect }) => {
  return (
    <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-700">
      <div className="p-2 space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-400 px-3 py-1">Ethereum</h3>
          <button
            onClick={() => onSelect('ethereum', 'metamask')}
            className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded-md flex items-center space-x-2"
          >
            <Wallet size={16} />
            <span>MetaMask</span>
          </button>
          <button
            onClick={() => onSelect('ethereum', 'coinbase')}
            className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded-md flex items-center space-x-2"
          >
            <Wallet size={16} />
            <span>Coinbase Wallet</span>
          </button>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-400 px-3 py-1">Stellar</h3>
          <button
            onClick={() => onSelect('stellar', 'freighter')}
            className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded-md flex items-center space-x-2"
          >
            <Wallet size={16} />
            <span>Freighter</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletDropdown;