import React, { useState, useEffect } from 'react';
import StellarSdk from 'stellar-sdk';
import SorobanConnect from '../components/SorobanConnect';
import { useSorobanWallet } from '../hooks/useSorobanWallet';

const SorobanDapp = () => {
  const { address, connected } = useSorobanWallet();
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchBalance = async () => {
      if (!connected || !address) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const server = new StellarSdk.Server('https://soroban-testnet.stellar.org');
        const account = await server.loadAccount(address);
        const nativeBalance = account.balances.find(b => b.asset_type === 'native');
        
        if (mounted) {
          setBalance(nativeBalance ? nativeBalance.balance : '0');
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to fetch balance');
          console.error('Balance fetch error:', err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [connected, address]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Soroban DApp</h1>

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <SorobanConnect />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-100">
          {error}
        </div>
      )}

      {connected && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Account Information</h2>
          
          <div className="mb-4">
            <p className="text-gray-400">Connected Address:</p>
            <p className="font-mono break-all bg-gray-900 p-2 rounded mt-1">
              {address}
            </p>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-400">Balance:</p>
            <p className="text-xl font-bold mt-1">
              {isLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : (
                <span>{parseFloat(balance).toFixed(7)} XLM</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SorobanDapp;