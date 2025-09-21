import React from 'react';
import { AlertCircle } from 'lucide-react';

const WalletError = ({ message }) => (
  <div className="absolute right-0 mt-2 p-3 bg-red-500 bg-opacity-90 text-white text-sm rounded-lg shadow-lg max-w-xs z-50 flex items-center space-x-2">
    <AlertCircle size={16} />
    <span>{message}</span>
  </div>
);

export default WalletError;