import React from 'react';
import { Wallet, X } from 'lucide-react';

const ConnectedWallet = ({ address, type, onDisconnect }) => {
  return (
    <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
      <Wallet size={16} className="text-green-400" />
      <span className="text-gray-300 text-sm">
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
      <button
        onClick={() => onDisconnect(type)}
        className="text-gray-400 hover:text-red-400 transition-colors duration-200"
        title="Disconnect"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ConnectedWallet;