import React, { useState } from 'react';
import { DollarSign, CreditCard, Coins, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ethers } from 'ethers';
import { signStellarMessage } from '../services/freighterService';

const PosSales = () => {
  const { ethereumAddress, stellarAddress } = useAppContext();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!amount || !paymentMethod) {
      setError('Please enter an amount and select a payment method');
      return;
    }

    setIsProcessing(true);
    setError('');
    setPaymentStatus(null);

    try {
      switch (paymentMethod) {
        case 'crypto':
          await processCryptoPayment();
          break;
        case 'credit':
          await processCreditCardPayment();
          break;
        case 'bank':
          await processBankPayment();
          break;
        default:
          throw new Error('Invalid payment method');
      }
    } catch (err) {
      setError(err.message);
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const processCryptoPayment = async () => {
    if (!ethereumAddress && !stellarAddress) {
      throw new Error('Please connect a crypto wallet first');
    }

    if (ethereumAddress) {
      // Process Ethereum payment
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // For demo purposes, we'll simulate a payment to a merchant address
      const merchantAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b5'; // Demo merchant address
      
      const tx = await signer.sendTransaction({
        to: merchantAddress,
        value: ethers.utils.parseEther((parseFloat(amount) * 0.0003).toString()), // Convert USD to ETH (rough estimate)
        gasLimit: 21000
      });

      setTransactionHash(tx.hash);
      setPaymentStatus('processing');

      // Wait for confirmation
      await tx.wait();
      setPaymentStatus('success');
    } else if (stellarAddress) {
      // Process Stellar payment using Freighter
      try {
        setPaymentStatus('processing');
        
        const message = `Payment confirmation for ${amount} USD (${parseFloat(amount) * 10} XLM) to merchant`;
        
        // Sign message with Freighter
        const signature = await signStellarMessage(message);
        
        if (signature) {
          // Simulate transaction hash for demo
          setTransactionHash('stellar_tx_' + Math.random().toString(36).substr(2, 9));
          setPaymentStatus('success');
        } else {
          throw new Error('Payment signature failed');
        }
      } catch (err) {
        if (err.message?.includes('User declined')) {
          throw new Error('Payment cancelled by user');
        }
        throw new Error('Stellar payment failed: ' + err.message);
      }
    }
  };

  const processCreditCardPayment = async () => {
    // Simulate credit card processing
    setPaymentStatus('processing');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate successful payment
    const mockTransactionId = 'cc_' + Math.random().toString(36).substr(2, 9);
    setTransactionHash(mockTransactionId);
    setPaymentStatus('success');
  };

  const processBankPayment = async () => {
    // Simulate bank transfer processing
    setPaymentStatus('processing');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate successful payment
    const mockTransactionId = 'bank_' + Math.random().toString(36).substr(2, 9);
    setTransactionHash(mockTransactionId);
    setPaymentStatus('success');
  };

  const resetForm = () => {
    setAmount('');
    setPaymentMethod('');
    setPaymentStatus(null);
    setTransactionHash('');
    setError('');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">POS Sales Terminal</h1>
      
      {paymentStatus === 'success' ? (
        <div className="bg-green-800 p-8 rounded-lg shadow-lg text-center">
          <CheckCircle className="mx-auto mb-4 text-green-400" size={64} />
          <h2 className="text-2xl font-bold text-white mb-4">Payment Successful!</h2>
          <p className="text-green-200 mb-2">Amount: {formatCurrency(amount)}</p>
          <p className="text-green-200 mb-4">Transaction ID: {transactionHash}</p>
          <button
            onClick={resetForm}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            New Transaction
          </button>
        </div>
      ) : (
        <form onSubmit={handlePayment} className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-white">Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-700 rounded px-8 py-3 text-white text-xl font-bold text-center"
                placeholder="0.00"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-4 text-white">Payment Method</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PaymentOption
                icon={<Coins size={32} />}
                label="Cryptocurrency"
                description="ETH, XLM"
                selected={paymentMethod === 'crypto'}
                onClick={() => setPaymentMethod('crypto')}
                disabled={isProcessing}
                available={ethereumAddress || stellarAddress}
                walletInfo={ethereumAddress ? 'ETH Wallet' : stellarAddress ? 'XLM Wallet' : null}
              />
              <PaymentOption
                icon={<CreditCard size={32} />}
                label="Credit Card"
                description="Visa, Mastercard"
                selected={paymentMethod === 'credit'}
                onClick={() => setPaymentMethod('credit')}
                disabled={isProcessing}
                available={true}
              />
              <PaymentOption
                icon={<DollarSign size={32} />}
                label="Bank Transfer"
                description="ACH, Wire"
                selected={paymentMethod === 'bank'}
                onClick={() => setPaymentMethod('bank')}
                disabled={isProcessing}
                available={true}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-100 flex items-center">
              <AlertCircle className="mr-2" size={20} />
              {error}
            </div>
          )}

          {paymentStatus === 'processing' && (
            <div className="mb-4 p-3 bg-blue-500 bg-opacity-20 border border-blue-500 rounded text-blue-100 flex items-center">
              <Loader className="mr-2 animate-spin" size={20} />
              Processing payment...
            </div>
          )}

          <button
            type="submit"
            className={`w-full font-bold py-3 px-4 rounded-lg flex items-center justify-center ${
              !paymentMethod || !amount || isProcessing
                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={!paymentMethod || !amount || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader className="mr-2 animate-spin" size={20} />
                Processing...
              </>
            ) : (
              <>
                Process Payment {amount && `(${formatCurrency(amount)})`}
              </>
            )}
          </button>

          {paymentMethod === 'crypto' && !ethereumAddress && !stellarAddress && (
            <p className="mt-4 text-yellow-400 text-sm text-center">
              Please connect a crypto wallet to use cryptocurrency payments
            </p>
          )}
        </form>
      )}
    </div>
  );
};

const PaymentOption = ({ icon, label, description, selected, onClick, disabled, available, walletInfo }) => (
  <div
    className={`flex flex-col items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${
      disabled 
        ? 'opacity-50 cursor-not-allowed' 
        : available
          ? selected 
            ? 'bg-blue-600 border-2 border-blue-400' 
            : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
          : 'bg-gray-700 opacity-60 cursor-not-allowed border-2 border-gray-600'
    }`}
    onClick={!disabled && available ? onClick : undefined}
  >
    <div className={`text-2xl mb-2 ${available ? 'text-white' : 'text-gray-500'}`}>
      {icon}
    </div>
    <span className={`text-sm font-medium ${available ? 'text-white' : 'text-gray-500'}`}>
      {label}
    </span>
    <span className={`text-xs mt-1 ${available ? 'text-gray-300' : 'text-gray-600'}`}>
      {description}
    </span>
    {walletInfo && (
      <span className="text-xs text-green-400 mt-1">{walletInfo}</span>
    )}
    {!available && (
      <span className="text-xs text-red-400 mt-1">Connect Wallet</span>
    )}
  </div>
);

export default PosSales;