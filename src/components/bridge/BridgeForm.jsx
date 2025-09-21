import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Calculator, Clock, AlertTriangle, Wallet, CheckCircle } from 'lucide-react';
import { useBridge } from '../../hooks/useBridge';
import { useAppContext } from '../../context/AppContext';

const BridgeForm = () => {
  const { ethereumAddress, stellarAddress } = useAppContext();
  const { initiateBridge, estimateFees, isProcessing, bridgeStatus, error, fees } = useBridge();
  
  const [formData, setFormData] = useState({
    fromChain: 'stellar',
    toChain: 'ethereum',
    amount: '',
    token: 'XLM',
  });

  const [showFees, setShowFees] = useState(false);
  const [feeError, setFeeError] = useState(null);
  const [isEstimatingFees, setIsEstimatingFees] = useState(false);

  const supportedChains = [
    { id: 'stellar', name: 'Stellar', token: 'XLM', network: 'Testnet' },
    { id: 'ethereum', name: 'Ethereum', token: 'ETH', network: 'Sepolia' },
    { id: 'base', name: 'Base', token: 'ETH', network: 'Goerli' },
    { id: 'optimism', name: 'Optimism', token: 'ETH', network: 'Goerli' },
  ];

  const supportedTokens = [
    { symbol: 'XLM', name: 'Stellar Lumens', chains: ['stellar'] },
    { symbol: 'ETH', name: 'Ethereum', chains: ['ethereum', 'base', 'optimism'] },
    { symbol: 'USDC', name: 'USD Coin', chains: ['stellar', 'ethereum', 'base', 'optimism'] },
  ];

  // Get available tokens for selected chains
  const getAvailableTokens = () => {
    return supportedTokens.filter(token => 
      token.chains.includes(formData.fromChain) && 
      token.chains.includes(formData.toChain)
    );
  };

  useEffect(() => {
    // Update token when chains change
    const availableTokens = getAvailableTokens();
    if (availableTokens.length > 0 && !availableTokens.find(t => t.symbol === formData.token)) {
      setFormData(prev => ({ ...prev, token: availableTokens[0].symbol }));
    }
  }, [formData.fromChain, formData.toChain]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setShowFees(false);
    setFeeError(null);
  };

  const handleSwapChains = () => {
    setFormData(prev => ({
      ...prev,
      fromChain: prev.toChain,
      toChain: prev.fromChain,
    }));
    setShowFees(false);
  };

  const handleEstimateFees = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFeeError('Please enter a valid amount');
      return;
    }

    try {
      setIsEstimatingFees(true);
      setFeeError(null);
      await estimateFees(formData.fromChain, formData.toChain, formData.amount, formData.token);
      setShowFees(true);
    } catch (err) {
      setFeeError(err.message);
    } finally {
      setIsEstimatingFees(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setFeeError('Please enter a valid amount');
      return;
    }

    try {
      await initiateBridge(formData);
    } catch (err) {
      console.error('Bridge initiation failed:', err);
    }
  };

  const isWalletConnected = (chain) => {
    return chain === 'stellar' ? stellarAddress : ethereumAddress;
  };

  const getWalletStatus = (chain) => {
    const connected = isWalletConnected(chain);
    return {
      connected,
      address: connected ? (chain === 'stellar' ? stellarAddress : ethereumAddress) : null,
    };
  };

  const canSubmit = () => {
    return (
      formData.amount &&
      parseFloat(formData.amount) > 0 &&
      isWalletConnected(formData.fromChain) &&
      isWalletConnected(formData.toChain) &&
      !isProcessing &&
      formData.fromChain !== formData.toChain
    );
  };

  const getConversionRate = () => {
    const rates = {
      'stellar-ethereum': { rate: 0.00003, from: 'XLM', to: 'ETH' },
      'ethereum-stellar': { rate: 33333, from: 'ETH', to: 'XLM' },
      'stellar-base': { rate: 0.00003, from: 'XLM', to: 'ETH' },
      'base-stellar': { rate: 33333, from: 'ETH', to: 'XLM' },
      'stellar-optimism': { rate: 0.00003, from: 'XLM', to: 'ETH' },
      'optimism-stellar': { rate: 33333, from: 'ETH', to: 'XLM' },
    };

    const key = `${formData.fromChain}-${formData.toChain}`;
    return rates[key] || { rate: 1, from: formData.token, to: formData.token };
  };

  const calculateReceiveAmount = () => {
    if (!formData.amount) return '0';
    const conversion = getConversionRate();
    return (parseFloat(formData.amount) * conversion.rate).toFixed(8);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Cross-Chain Bridge</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-100 flex items-center">
            <AlertTriangle className="mr-2 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold">Bridge Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* From Chain */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">From Chain</label>
                <select
                  value={formData.fromChain}
                  onChange={(e) => handleInputChange('fromChain', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {supportedChains.map(chain => (
                    <option key={chain.id} value={chain.id} disabled={chain.id === formData.toChain}>
                      {chain.name} ({chain.network})
                    </option>
                  ))}
                </select>
                <WalletStatus chain={formData.fromChain} {...getWalletStatus(formData.fromChain)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">To Chain</label>
                <select
                  value={formData.toChain}
                  onChange={(e) => handleInputChange('toChain', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {supportedChains.filter(chain => chain.id !== formData.fromChain).map(chain => (
                    <option key={chain.id} value={chain.id}>
                      {chain.name} ({chain.network})
                    </option>
                  ))}
                </select>
                <WalletStatus chain={formData.toChain} {...getWalletStatus(formData.toChain)} />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleSwapChains}
                className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors group"
                title="Swap chains"
              >
                <ArrowRightLeft className="text-blue-400 group-hover:text-blue-300 transition-colors" size={24} />
              </button>
            </div>
          </div>

          {/* Amount and Token */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Token</label>
                <select
                  value={formData.token}
                  onChange={(e) => handleInputChange('token', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getAvailableTokens().map(token => (
                    <option key={token.symbol} value={token.symbol}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conversion Preview */}
            {formData.amount && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-gray-300 text-sm">You Send</p>
                    <p className="text-white font-bold text-lg">
                      {formData.amount} {formData.token}
                    </p>
                    <p className="text-gray-400 text-xs">on {supportedChains.find(c => c.id === formData.fromChain)?.name}</p>
                  </div>
                  
                  <ArrowRightLeft className="text-blue-400" size={20} />
                  
                  <div className="text-center">
                    <p className="text-gray-300 text-sm">You Receive</p>
                    <p className="text-white font-bold text-lg">
                      {calculateReceiveAmount()} {getConversionRate().to}
                    </p>
                    <p className="text-gray-400 text-xs">on {supportedChains.find(c => c.id === formData.toChain)?.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fee Estimation */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleEstimateFees}
              disabled={isEstimatingFees || !formData.amount}
              className={`flex items-center px-4 py-2 rounded-md font-semibold transition-colors ${
                isEstimatingFees || !formData.amount
                  ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              <Calculator className={`mr-2 ${isEstimatingFees ? 'animate-spin' : ''}`} size={16} />
              {isEstimatingFees ? 'Estimating...' : 'Estimate Fees'}
            </button>
          </div>

          {feeError && (
            <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-100 flex items-center">
              <AlertTriangle className="mr-2 flex-shrink-0" size={16} />
              {feeError}
            </div>
          )}

          {showFees && fees && (
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold mb-3 text-white flex items-center">
                <Calculator className="mr-2" size={20} />
                Fee Breakdown
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Source Chain Fee:</span>
                  <span className="text-white">{fees.sourceFee} {formData.token}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Target Chain Fee:</span>
                  <span className="text-white">{fees.targetFee} {getConversionRate().to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Bridge Fee (0.1%):</span>
                  <span className="text-white">{fees.bridgeFee.toFixed(6)} {formData.token}</span>
                </div>
                <hr className="border-gray-600" />
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-300">Total Fee:</span>
                  <span className="text-white">{fees.totalFee.toFixed(6)} {formData.token}</span>
                </div>
                <div className="flex items-center text-gray-400 mt-2">
                  <Clock className="mr-1" size={14} />
                  <span>Estimated time: {fees.estimatedTime} minutes</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit()}
            className={`w-full py-3 px-4 rounded-md font-semibold transition-colors flex items-center justify-center ${
              canSubmit()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-600 cursor-not-allowed text-gray-400'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Bridge...
              </>
            ) : (
              <>
                <ArrowRightLeft className="mr-2" size={20} />
                Initiate Bridge
              </>
            )}
          </button>

          {/* Wallet Connection Warnings */}
          {(!isWalletConnected(formData.fromChain) || !isWalletConnected(formData.toChain)) && (
            <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded p-4">
              <div className="flex items-center text-yellow-100">
                <AlertTriangle className="mr-2 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold">Wallet Connection Required</p>
                  <p className="text-sm text-yellow-200 mt-1">
                    Please connect both source and destination wallets to proceed with the bridge.
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Bridge Status */}
        {bridgeStatus && (
          <BridgeStatusDisplay status={bridgeStatus} />
        )}
      </div>
    </div>
  );
};

const WalletStatus = ({ chain, connected, address }) => {
  const getChainName = (chainId) => {
    const names = {
      stellar: 'Stellar',
      ethereum: 'Ethereum',
      base: 'Base',
      optimism: 'Optimism',
    };
    return names[chainId] || chainId;
  };

  return (
    <div className={`mt-2 flex items-center text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
      {connected ? (
        <>
          <CheckCircle className="mr-1" size={12} />
          <span>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </>
      ) : (
        <>
          <Wallet className="mr-1" size={12} />
          <span>{getChainName(chain)} wallet not connected</span>
        </>
      )}
    </div>
  );
};

const BridgeStatusDisplay = ({ status }) => {
  const getStatusColor = (statusValue) => {
    switch (statusValue) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (statusValue) => {
    switch (statusValue) {
      case 'completed': return <CheckCircle size={20} />;
      case 'processing': return <Clock size={20} />;
      case 'error': return <AlertTriangle size={20} />;
      default: return <Clock size={20} />;
    }
  };

  return (
    <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
      <div className="flex items-center mb-3">
        <span className={getStatusColor(status.status)}>
          {getStatusIcon(status.status)}
        </span>
        <h3 className="text-lg font-semibold ml-2 text-white">Bridge Status</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-300">Bridge ID:</span>
          <span className="text-white font-mono">{status.bridgeId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Status:</span>
          <span className={`font-semibold ${getStatusColor(status.status)}`}>
            {status.status.toUpperCase()}
          </span>
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
          <div className="flex justify-between">
            <span className="text-gray-300">Stellar Tx:</span>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${status.stellarTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono text-xs"
            >
              {status.stellarTxHash.slice(0, 8)}...{status.stellarTxHash.slice(-8)}
            </a>
          </div>
        )}
        
        {(status.targetTxHash || status.sourceTxHash) && (
          <div className="flex justify-between">
            <span className="text-gray-300">EVM Tx:</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${status.targetTxHash || status.sourceTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 font-mono text-xs"
            >
              {(status.targetTxHash || status.sourceTxHash).slice(0, 8)}...
              {(status.targetTxHash || status.sourceTxHash).slice(-8)}
            </a>
          </div>
        )}

        {status.status === 'processing' && (
          <div className="mt-3 flex items-center text-yellow-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>
            <span className="text-sm">Monitoring transaction progress...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BridgeForm;