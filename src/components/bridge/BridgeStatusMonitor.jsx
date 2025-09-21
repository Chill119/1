import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

const BridgeStatusMonitor = ({ bridgeId, onComplete }) => {
  const [status, setStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bridgeId || !isPolling) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/bridge/status/${bridgeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const statusData = await response.json();
        setStatus(statusData);

        if (statusData.status === 'completed' || statusData.status === 'error') {
          setIsPolling(false);
          if (onComplete) {
            onComplete(statusData);
          }
        }
      } catch (err) {
        setError(err.message);
        setIsPolling(false);
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval
    const interval = setInterval(pollStatus, 5000);

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [bridgeId, isPolling, onComplete]);

  if (!status) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
        <span className="ml-2 text-gray-300">Loading bridge status...</span>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="text-green-400" size={24} />;
      case 'processing':
        return <Clock className="text-yellow-400" size={24} />;
      case 'error':
        return <AlertCircle className="text-red-400" size={24} />;
      default:
        return <Clock className="text-gray-400" size={24} />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-700 p-6 rounded-lg">
      <div className="flex items-center mb-4">
        {getStatusIcon()}
        <h3 className="text-xl font-semibold ml-3 text-white">
          Bridge Transaction Status
        </h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-300">Status:</span>
          <span className={`font-semibold ${getStatusColor()}`}>
            {status.status.toUpperCase()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-300">Bridge ID:</span>
          <span className="text-white font-mono text-sm">{status.bridgeId}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-300">Route:</span>
          <span className="text-white">
            {status.fromChain} → {status.toChain}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-300">Amount:</span>
          <span className="text-white">
            {status.amount} {status.token}
          </span>
        </div>

        {status.stellarTxHash && (
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Stellar Tx:</span>
            <div className="flex items-center">
              <span className="text-blue-400 font-mono text-sm mr-2">
                {status.stellarTxHash.slice(0, 8)}...{status.stellarTxHash.slice(-8)}
              </span>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${status.stellarTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        )}

        {(status.targetTxHash || status.sourceTxHash) && (
          <div className="flex justify-between items-center">
            <span className="text-gray-300">EVM Tx:</span>
            <div className="flex items-center">
              <span className="text-blue-400 font-mono text-sm mr-2">
                {(status.targetTxHash || status.sourceTxHash).slice(0, 8)}...
                {(status.targetTxHash || status.sourceTxHash).slice(-8)}
              </span>
              <a
                href={`https://sepolia.etherscan.io/tx/${status.targetTxHash || status.sourceTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        )}

        {status.error && (
          <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-100">
            <strong>Error:</strong> {status.error}
          </div>
        )}

        {isPolling && status.status === 'processing' && (
          <div className="mt-4 flex items-center text-yellow-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>
            <span className="text-sm">Monitoring transaction progress...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BridgeStatusMonitor;