import React, { useState, useEffect } from 'react';
import { Send, Download, History, RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ethers } from 'ethers';
import { walletTransactionService } from '../services/WalletTransactionService';
import ethereumWallet from '../services/wallets/ethereum';
import stellarWallet from '../services/wallets/stellar';

const Wallet = () => {
  const { ethereumAddress, stellarAddress } = useAppContext();
  const [balances, setBalances] = useState({
    ethereum: '0',
    stellar: '0'
  });
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('send');

  useEffect(() => {
    if (ethereumAddress || stellarAddress) {
      fetchBalances();
      fetchTransactionHistory();
    }
  }, [ethereumAddress, stellarAddress, selectedChain]);

  const fetchBalances = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (selectedChain === 'ethereum' && ethereumAddress && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(ethereumAddress);
        setBalances(prev => ({
          ...prev,
          ethereum: ethers.formatEther(balance)
        }));
      }

      if (selectedChain === 'stellar' && stellarAddress) {
        // Simulate Stellar balance fetch
        setBalances(prev => ({
          ...prev,
          stellar: (Math.random() * 1000).toFixed(7)
        }));
      }
    } catch (err) {
      setError('Failed to fetch balance');
      console.error('Error fetching balance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      const txHistory = await walletTransactionService.getTransactionHistory(selectedChain, 20);
      setTransactions(txHistory.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        token: tx.token,
        to: tx.to,
        from: tx.from,
        timestamp: tx.timestamp,
        status: tx.status,
        hash: tx.hash,
      })));
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setTransactions([]);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!recipient || !amount) {
      setError('Please fill in all fields');
      return;
    }

    const connectedAddress = selectedChain === 'ethereum' ? ethereumAddress : stellarAddress;
    if (!connectedAddress) {
      setError(`Please connect your ${selectedChain} wallet first`);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (selectedChain === 'ethereum' && window.ethereum) {
        const tx = await ethereumWallet.sendTransaction(recipient, amount);

        await walletTransactionService.saveTransaction({
          hash: tx.hash,
          chain: 'ethereum',
          type: 'send',
          from: connectedAddress,
          to: recipient,
          amount,
          token: 'ETH',
          status: 'pending',
        });

        const newTransaction = {
          id: Date.now().toString(),
          type: 'send',
          amount,
          token: 'ETH',
          to: recipient,
          timestamp: Date.now(),
          status: 'pending',
          hash: tx.hash
        };
        setTransactions(prev => [newTransaction, ...prev]);

        await tx.wait();

        await walletTransactionService.updateTransactionStatus(tx.hash, 'completed');

        setTransactions(prev =>
          prev.map(t => t.hash === tx.hash ? { ...t, status: 'completed' } : t)
        );

        await fetchBalances();
      } else if (selectedChain === 'stellar') {
        const result = await stellarWallet.sendPayment(recipient, amount);

        await walletTransactionService.saveTransaction({
          hash: result.hash,
          chain: 'stellar',
          type: 'send',
          from: connectedAddress,
          to: recipient,
          amount,
          token: 'XLM',
          status: 'completed',
        });

        const newTransaction = {
          id: Date.now().toString(),
          type: 'send',
          amount,
          token: 'XLM',
          to: recipient,
          timestamp: Date.now(),
          status: 'completed',
          hash: result.hash
        };
        setTransactions(prev => [newTransaction, ...prev]);

        await fetchBalances();
      }

      setRecipient('');
      setAmount('');
    } catch (err) {
      setError(err.message || 'Transaction failed');
      console.error('Send failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConnectedAddress = () => {
    return selectedChain === 'ethereum' ? ethereumAddress : stellarAddress;
  };

  const getCurrentBalance = () => {
    return selectedChain === 'ethereum' ? balances.ethereum : balances.stellar;
  };

  const getTokenSymbol = () => {
    return selectedChain === 'ethereum' ? 'ETH' : 'XLM';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">Digital Wallet</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-500 text-white rounded-lg">
          {error}
        </div>
      )}

      {/* Chain Selector */}
      <div className="mb-8 flex justify-center">
        <div className="bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setSelectedChain('ethereum')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              selectedChain === 'ethereum'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Ethereum
          </button>
          <button
            onClick={() => setSelectedChain('stellar')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              selectedChain === 'stellar'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Stellar
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">Balance</h2>
          <button
            onClick={fetchBalances}
            className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} size={16} />
            Refresh
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-4xl font-bold text-white mb-2">
            {isLoading ? 'Loading...' : `${parseFloat(getCurrentBalance()).toFixed(6)} ${getTokenSymbol()}`}
          </p>
          <p className="text-gray-400">
            ≈ ${(parseFloat(getCurrentBalance()) * (selectedChain === 'ethereum' ? 3000 : 0.1)).toFixed(2)} USD
          </p>
        </div>

        {/* Wallet Address */}
        {getConnectedAddress() && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Wallet Address</p>
                <p className="font-mono text-white break-all">
                  {getConnectedAddress()}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(getConnectedAddress())}
                className="ml-4 p-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
              >
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex justify-center">
        <div className="bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors flex items-center ${
              activeTab === 'send'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Send className="mr-2" size={16} />
            Send
          </button>
          <button
            onClick={() => setActiveTab('receive')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors flex items-center ${
              activeTab === 'receive'
                ? 'bg-green-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <Download className="mr-2" size={16} />
            Receive
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md font-semibold transition-colors flex items-center ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <History className="mr-2" size={16} />
            History
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeTab === 'send' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-white">Send {getTokenSymbol()}</h2>
            <form onSubmit={handleSend}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-300">Recipient Address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  placeholder={selectedChain === 'ethereum' ? '0x...' : 'G...'}
                  disabled={!getConnectedAddress() || isLoading}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-300">Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.000000000000000001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2 pr-16 text-white"
                    placeholder="0.0"
                    disabled={!getConnectedAddress() || isLoading}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {getTokenSymbol()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAmount(getCurrentBalance())}
                  className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                  disabled={!getConnectedAddress() || isLoading}
                >
                  Use Max Balance
                </button>
              </div>
              <button
                type="submit"
                className={`w-full ${
                  getConnectedAddress() && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 cursor-not-allowed'
                } text-white font-bold py-2 px-4 rounded flex items-center justify-center`}
                disabled={!getConnectedAddress() || isLoading}
              >
                <Send className="mr-2" />
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'receive' && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-white">Receive {getTokenSymbol()}</h2>
            {getConnectedAddress() ? (
              <div className="space-y-4">
                <p className="text-gray-300">Share this address to receive payments:</p>
                <div className="bg-gray-700 p-4 rounded break-all">
                  <p className="font-mono text-white">{getConnectedAddress()}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(getConnectedAddress())}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
                  >
                    {copied ? <Check className="mr-2" /> : <Copy className="mr-2" />}
                    {copied ? 'Copied!' : 'Copy Address'}
                  </button>
                </div>
                
                {/* QR Code Placeholder */}
                <div className="mt-6 text-center">
                  <div className="w-48 h-48 bg-gray-700 mx-auto rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">QR Code</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">QR code for easy sharing</p>
                </div>
              </div>
            ) : (
              <p className="text-yellow-500">Please connect your {selectedChain} wallet first</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="lg:col-span-2">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-white">Transaction History</h2>
                <button
                  onClick={fetchTransactionHistory}
                  className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                >
                  <RefreshCw className="mr-2" size={16} />
                  Refresh
                </button>
              </div>
              
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <History className="mx-auto mb-4" size={48} />
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-full mr-3 ${
                            tx.type === 'send' ? 'bg-red-500' : 'bg-green-500'
                          }`}>
                            {tx.type === 'send' ? <Send size={16} /> : <Download size={16} />}
                          </div>
                          <div>
                            <p className="text-white font-semibold">
                              {tx.type === 'send' ? 'Sent' : 'Received'} {tx.amount} {tx.token}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {tx.type === 'send' ? `To: ${tx.to.slice(0, 10)}...` : `From: ${tx.from?.slice(0, 10)}...`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            tx.status === 'completed' ? 'text-green-400' : 
                            tx.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {tx.status.toUpperCase()}
                          </p>
                          <p className="text-gray-400 text-sm">{formatDate(tx.timestamp)}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 font-mono">
                        {tx.hash}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!getConnectedAddress() && (
        <div className="mt-8 bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded p-4">
          <div className="flex items-center text-yellow-100">
            <div>
              <p className="font-semibold">Wallet Connection Required</p>
              <p className="text-sm text-yellow-200 mt-1">
                Please connect your {selectedChain} wallet to access wallet features.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;