import React, { useState } from 'react';
import { DollarSign, CreditCard, Coins, CheckCircle, AlertCircle, Loader, QrCode } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ethers } from 'ethers';

const PosSales = () => {
  const { ethereumAddress, stellarAddress } = useAppContext();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method');
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
        case 'qr':
          await generateQRPayment();
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
      if (!window.ethereum) {
        throw new Error('MetaMask not available');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Demo merchant address
      const merchantAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b5';
      
      const tx = await signer.sendTransaction({
        to: merchantAddress,
        value: ethers.parseEther((parseFloat(amount) * 0.0003).toString()), // Convert USD to ETH
        gasLimit: 21000
      });

      setTransactionHash(tx.hash);
      setPaymentStatus('processing');

      // Wait for confirmation
      await tx.wait();
      setPaymentStatus('success');
      
      // Send receipt
      await sendReceipt('Cryptocurrency', tx.hash);
    } else if (stellarAddress) {
      // Process Stellar payment using Freighter
      try {
        setPaymentStatus('processing');
        
        if (!window.freighter) {
          throw new Error('Freighter wallet not available');
        }

        // Check if connected
        const isConnected = await window.freighter.isConnected();
        if (!isConnected) {
          throw new Error('Please connect your Freighter wallet');
        }

        // Get public key
        const publicKey = await window.freighter.getPublicKey();
        
        // Simulate transaction hash for demo
        const mockTxHash = 'stellar_tx_' + Math.random().toString(36).substr(2, 9);
        setTransactionHash(mockTxHash);
        setPaymentStatus('success');
        
        // Send receipt
        await sendReceipt('Stellar Lumens', mockTxHash);
      } catch (err) {
        if (err.message?.includes('User declined')) {
          throw new Error('Payment cancelled by user');
        }
        throw new Error('Stellar payment failed: ' + err.message);
      }
    }
  };

  const processCreditCardPayment = async () => {
    setPaymentStatus('processing');
    
    // Simulate credit card processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockTransactionId = 'cc_' + Math.random().toString(36).substr(2, 9);
    setTransactionHash(mockTransactionId);
    setPaymentStatus('success');
    
    // Send receipt
    await sendReceipt('Credit Card', mockTransactionId);
  };

  const processBankPayment = async () => {
    setPaymentStatus('processing');
    
    // Simulate bank transfer processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockTransactionId = 'bank_' + Math.random().toString(36).substr(2, 9);
    setTransactionHash(mockTransactionId);
    setPaymentStatus('success');
    
    // Send receipt
    await sendReceipt('Bank Transfer', mockTransactionId);
  };

  const generateQRPayment = async () => {
    setPaymentStatus('processing');
    
    // Generate QR code for payment
    const paymentData = {
      amount: parseFloat(amount),
      currency: 'USD',
      merchant: 'London Blockchain Bridge',
      timestamp: Date.now()
    };
    
    const qrData = JSON.stringify(paymentData);
    setQrCode(qrData);
    setPaymentStatus('qr_generated');
    
    // Simulate QR payment completion after 10 seconds
    setTimeout(() => {
      const mockTransactionId = 'qr_' + Math.random().toString(36).substr(2, 9);
      setTransactionHash(mockTransactionId);
      setPaymentStatus('success');
      sendReceipt('QR Code Payment', mockTransactionId);
    }, 10000);
  };

  const sendReceipt = async (paymentType, txId) => {
    if (customerEmail) {
      // Simulate sending email receipt
      console.log(`Receipt sent to ${customerEmail} for ${paymentType} payment: ${txId}`);
    }
  };

  const resetForm = () => {
    setAmount('');
    setPaymentMethod('');
    setPaymentStatus(null);
    setTransactionHash('');
    setError('');
    setQrCode('');
    setCustomerEmail('');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">POS Sales Terminal</h1>
      
      {paymentStatus === 'success' ? (
        <div className="bg-green-800 p-8 rounded-lg shadow-lg text-center">
          <CheckCircle className="mx-auto mb-4 text-green-400" size={64} />
          <h2 className="text-2xl font-bold text-white mb-4">Payment Successful!</h2>
          <div className="space-y-2 text-green-200">
            <p>Amount: {formatCurrency(amount)}</p>
            <p>Transaction ID: {transactionHash}</p>
            <p>Payment Method: {getPaymentMethodName(paymentMethod)}</p>
            {customerEmail && <p>Receipt sent to: {customerEmail}</p>}
          </div>
          <button
            onClick={resetForm}
            className="mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            New Transaction
          </button>
        </div>
      ) : paymentStatus === 'qr_generated' ? (
        <div className="bg-blue-800 p-8 rounded-lg shadow-lg text-center">
          <QrCode className="mx-auto mb-4 text-blue-400" size={64} />
          <h2 className="text-2xl font-bold text-white mb-4">Scan QR Code to Pay</h2>
          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 text-sm">QR Code: {qrCode.slice(0, 20)}...</span>
            </div>
          </div>
          <p className="text-blue-200 mb-4">Amount: {formatCurrency(amount)}</p>
          <p className="text-blue-300 text-sm">Waiting for payment confirmation...</p>
          <div className="mt-4 flex items-center justify-center text-blue-400">
            <Loader className="animate-spin mr-2" size={20} />
            <span>Processing payment...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <form onSubmit={handlePayment} className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Payment Details</h2>
            
            {/* Customer Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Customer Email (Optional)</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                placeholder="customer@example.com"
              />
            </div>

            {/* Amount */}
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

            {/* Payment Methods */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-4 text-white">Payment Method</label>
              <div className="grid grid-cols-2 gap-4">
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
                <PaymentOption
                  icon={<QrCode size={32} />}
                  label="QR Code"
                  description="Mobile Pay"
                  selected={paymentMethod === 'qr'}
                  onClick={() => setPaymentMethod('qr')}
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

          {/* Transaction Summary */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-6">Transaction Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-300">Subtotal:</span>
                <span className="text-white">{amount ? formatCurrency(amount) : '$0.00'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Processing Fee:</span>
                <span className="text-white">
                  {amount ? formatCurrency(parseFloat(amount) * 0.029) : '$0.00'}
                </span>
              </div>
              
              <hr className="border-gray-600" />
              
              <div className="flex justify-between font-bold">
                <span className="text-white">Total:</span>
                <span className="text-white">
                  {amount ? formatCurrency(parseFloat(amount) * 1.029) : '$0.00'}
                </span>
              </div>
              
              {paymentMethod && (
                <div className="mt-4 p-3 bg-gray-700 rounded">
                  <p className="text-sm text-gray-300">Payment Method:</p>
                  <p className="text-white font-semibold">{getPaymentMethodName(paymentMethod)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
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
    {!available && label === 'Cryptocurrency' && (
      <span className="text-xs text-red-400 mt-1">Connect Wallet</span>
    )}
  </div>
);

const getPaymentMethodName = (method) => {
  const names = {
    crypto: 'Cryptocurrency',
    credit: 'Credit Card',
    bank: 'Bank Transfer',
    qr: 'QR Code Payment'
  };
  return names[method] || method;
};

export default PosSales;