import React, { useEffect } from 'react';
import { History, ExternalLink, RefreshCw } from 'lucide-react';
import { useBridge } from '../../hooks/useBridge';

const BridgeHistory = () => {
  const { getBridgeHistory, bridgeHistory, error } = useBridge();

  useEffect(() => {
    getBridgeHistory();
  }, [getBridgeHistory]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExplorerUrl = (txHash, chain) => {
    const explorers = {
      stellar: `https://stellar.expert/explorer/testnet/tx/${txHash}`,
      ethereum: `https://sepolia.etherscan.io/tx/${txHash}`,
      base: `https://goerli.basescan.org/tx/${txHash}`,
      optimism: `https://goerli-optimism.etherscan.io/tx/${txHash}`,
    };
    return explorers[chain];
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <History className="mr-2" size={24} />
            Bridge History
          </h2>
          <button
            onClick={getBridgeHistory}
            className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors"
          >
            <RefreshCw className="mr-2" size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-100">
            {error}
          </div>
        )}

        {bridgeHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <History className="mx-auto mb-4" size={48} />
            <p>No bridge transactions found</p>
            <p className="text-sm mt-2">Your bridge history will appear here after you make transactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bridgeHistory.map((bridge) => (
              <div key={bridge.bridgeId} className="bg-gray-700 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold text-white mb-2">Bridge Details</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Route:</span>
                        <span className="text-white">
                          {bridge.fromChain} → {bridge.toChain}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Amount:</span>
                        <span className="text-white">{bridge.amount} {bridge.token}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Status:</span>
                        <span className={`font-semibold ${getStatusColor(bridge.status)}`}>
                          {bridge.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Date:</span>
                        <span className="text-white">{formatDate(bridge.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">Transaction Hashes</h3>
                    <div className="space-y-2 text-sm">
                      {bridge.stellarTxHash && (
                        <div>
                          <span className="text-gray-300 block">Stellar:</span>
                          <div className="flex items-center">
                            <span className="font-mono text-blue-400 mr-2">
                              {bridge.stellarTxHash.slice(0, 8)}...{bridge.stellarTxHash.slice(-8)}
                            </span>
                            <a
                              href={getExplorerUrl(bridge.stellarTxHash, 'stellar')}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      )}
                      {(bridge.targetTxHash || bridge.sourceTxHash) && (
                        <div>
                          <span className="text-gray-300 block">
                            {bridge.toChain === 'stellar' ? bridge.fromChain : bridge.toChain}:
                          </span>
                          <div className="flex items-center">
                            <span className="font-mono text-blue-400 mr-2">
                              {(bridge.targetTxHash || bridge.sourceTxHash).slice(0, 8)}...
                              {(bridge.targetTxHash || bridge.sourceTxHash).slice(-8)}
                            </span>
                            <a
                              href={getExplorerUrl(
                                bridge.targetTxHash || bridge.sourceTxHash,
                                bridge.toChain === 'stellar' ? bridge.fromChain : bridge.toChain
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">Addresses</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-300 block">From:</span>
                        <span className="font-mono text-white">
                          {bridge.fromAddress?.slice(0, 6)}...{bridge.fromAddress?.slice(-4)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-300 block">To:</span>
                        <span className="font-mono text-white">
                          {bridge.toAddress?.slice(0, 6)}...{bridge.toAddress?.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BridgeHistory;