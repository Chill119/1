import React, { useState } from 'react';
import { isWalletConnected, connectEVMWallet, connectStellarWallet } from '../utils/walletUtils';

const WalletTester = () => {
  const [detectionResults, setDetectionResults] = useState(null);
  const [connectionResults, setConnectionResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const runDetectionTests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = {
        evm: {
          metamask: await isWalletConnected('ethereum', 'metamask'),
          coinbase: await isWalletConnected('ethereum', 'coinbase')
        },
        stellar: {
          freighter: await isWalletConnected('stellar', 'freighter')
        }
      };
      setDetectionResults(results);
    } catch (err) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  const runConnectionTests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = {
        evm: {},
        stellar: {}
      };

      try {
        const metamaskResult = await connectEVMWallet('ethereum', 'metamask');
        results.evm.metamask = {
          address: metamaskResult.address,
          type: metamaskResult.type,
          chainId: metamaskResult.chainId
        };
      } catch (error) {
        results.evm.metamask = { error: error.message };
      }

      try {
        const freighterResult = await connectStellarWallet('freighter');
        results.stellar.freighter = {
          address: freighterResult.address,
          type: freighterResult.type,
          network: freighterResult.network
        };
      } catch (error) {
        results.stellar.freighter = { error: error.message };
      }

      setConnectionResults(results);
    } catch (err) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Wallet Testing Suite</h2>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={runDetectionTests}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Test Wallet Detection
        </button>
        <button
          onClick={runConnectionTests}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
        >
          Test Wallet Connection
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded">
          {error}
        </div>
      )}

      {detectionResults && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Detection Results</h3>
          <ResultsDisplay results={detectionResults} />
        </div>
      )}

      {connectionResults && (
        <div>
          <h3 className="text-xl font-semibold mb-3">Connection Results</h3>
          <ResultsDisplay results={connectionResults} />
        </div>
      )}
    </div>
  );
};

const ResultsDisplay = ({ results }) => (
  <div className="grid gap-4">
    <div>
      <h4 className="text-lg font-medium mb-2">EVM Wallets</h4>
      <div className="grid gap-2">
        {Object.entries(results.evm).map(([wallet, result]) => (
          <div key={wallet} className="flex items-center gap-2">
            <span className="font-medium">{wallet}:</span>
            {typeof result === 'boolean' ? (
              <span className={result ? 'text-green-400' : 'text-red-400'}>
                {result ? 'Detected' : 'Not Detected'}
              </span>
            ) : (
              <span className="text-gray-300">
                {result.error || `Connected (${result.address?.slice(0, 6)}...${result.address?.slice(-4)})`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>

    <div>
      <h4 className="text-lg font-medium mb-2">Stellar Wallets</h4>
      <div className="grid gap-2">
        {Object.entries(results.stellar).map(([wallet, result]) => (
          <div key={wallet} className="flex items-center gap-2">
            <span className="font-medium">{wallet}:</span>
            {typeof result === 'boolean' ? (
              <span className={result ? 'text-green-400' : 'text-red-400'}>
                {result ? 'Detected' : 'Not Detected'}
              </span>
            ) : (
              <span className="text-gray-300">
                {result.error || `Connected (${result.address?.slice(0, 6)}...${result.address?.slice(-4)})`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default WalletTester;