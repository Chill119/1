import React, { useState, useEffect } from 'react';
import { Send, Download } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ethers } from 'ethers';

const Wallet = () => {
  const { walletConnected, walletAddress } = useAppContext();
  const [balance, setBalance] = useState('0');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (walletConnected && walletAddress) {
      fetchBalance();
    }
  }, [walletConnected, walletAddress, selectedChain]);

  const fetchBalance = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const balance = await provider.getBalance(walletAddress);
        setBalance(ethers.utils.formatEther(balance));
      }
    } catch (err) {
      setError('Failed to fetch balance');
      console.error('Error fetching balance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!walletConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.utils.parseEther(amount)
      });

      await tx.wait();
      
      // Refresh balance after successful transaction
      await fetchBalance();
      
      // Clear form
      setRecipient('');
      setAmount('');
    } catch (err) {
      setError(err.message || 'Transaction failed');
      console.error('Send failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Digital Wallet</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-500 text-white rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Balance</h2>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold">
            {isLoading ? 'Loading...' : `${balance} ${selectedChain === 'ethereum' ? 'ETH' : 'MATIC'}`}
          </p>
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="bg-gray-700 rounded px-3 py-2"
          >
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Send</h2>
          <form onSubmit={handleSend}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2"
                placeholder="0x..."
                disabled={!walletConnected || isLoading}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                step="0.000000000000000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2"
                placeholder="0.0"
                disabled={!walletConnected || isLoading}
              />
            </div>
            <button
              type="submit"
              className={`w-full ${
                walletConnected && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-600 cursor-not-allowed'
              } text-white font-bold py-2 px-4 rounded flex items-center justify-center`}
              disabled={!walletConnected || isLoading}
            >
              <Send className="mr-2" />
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Receive</h2>
          <p className="mb-4">Your wallet address:</p>
          {walletConnected ? (
            <div className="bg-gray-700 p-4 rounded break-all">
              {walletAddress}
            </div>
          ) : (
            <p className="text-yellow-500">Please connect your wallet first</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;