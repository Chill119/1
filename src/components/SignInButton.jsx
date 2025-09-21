import React, { useState, useCallback } from 'react';
import { Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const SignInButton = () => {
  const { signIn, isLoading, error } = useAuth();
  const [showOptions, setShowOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSignIn = useCallback(async (type, provider = null) => {
    if (isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      await signIn(type, provider);
      setShowOptions(false);
    } catch (error) {
      console.error('Sign-in error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [signIn, isProcessing]);

  return (
    <div className="relative">
      <button
        onClick={() => !isProcessing && setShowOptions(!showOptions)}
        disabled={isLoading || isProcessing}
        className={`flex items-center px-4 py-2 rounded ${
          isLoading || isProcessing ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
        } text-white font-bold transition-colors duration-200`}
      >
        <Wallet className="mr-2" size={16} />
        {isLoading || isProcessing ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {showOptions && !isProcessing && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <button
              onClick={() => handleSignIn('evm', 'metamask')}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              MetaMask
            </button>
            <button
              onClick={() => handleSignIn('stellar')}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              Freighter (Stellar)
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute right-0 mt-2 w-64 p-2 rounded bg-red-500 text-white text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default SignInButton;