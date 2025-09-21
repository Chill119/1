import { useState, useCallback } from 'react';
import { bridgeAPI } from '../services/bridge/BridgeAPI.js';
import { useAppContext } from '../context/AppContext';
import { ethers } from 'ethers';

export const useBridge = () => {
  const { ethereumAddress, stellarAddress } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState(null);
  const [error, setError] = useState(null);
  const [fees, setFees] = useState(null);
  const [bridgeHistory, setBridgeHistory] = useState([]);

  const initiateBridge = useCallback(async (bridgeParams) => {
    const { fromChain, toChain, amount, token } = bridgeParams;

    try {
      setIsProcessing(true);
      setError(null);

      // Validate wallet connections
      const fromAddress = fromChain === 'stellar' ? stellarAddress : ethereumAddress;
      const toAddress = toChain === 'stellar' ? stellarAddress : ethereumAddress;

      if (!fromAddress) {
        throw new Error(`Please connect your ${fromChain} wallet first`);
      }

      if (!toAddress) {
        throw new Error(`Please connect your ${toChain} wallet first`);
      }

      // Get user signature for transaction authorization
      let userSignature;
      const message = `Authorize bridge: ${amount} ${token} from ${fromChain} to ${toChain}\nTimestamp: ${Date.now()}`;

      if (fromChain === 'stellar') {
        if (!window.freighter) {
          throw new Error('Freighter wallet not available');
        }
        
        try {
          userSignature = await window.freighter.signMessage(message);
        } catch (err) {
          if (err.message?.includes('User declined')) {
            throw new Error('Transaction authorization rejected');
          }
          throw new Error('Failed to sign authorization message');
        }
      } else {
        if (!window.ethereum) {
          throw new Error('Ethereum wallet not available');
        }
        
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          userSignature = await signer.signMessage(message);
        } catch (err) {
          if (err.code === 4001) {
            throw new Error('Transaction authorization rejected');
          }
          throw new Error('Failed to sign authorization message');
        }
      }

      // Initiate bridge transaction
      const bridgeRequest = {
        fromChain,
        toChain,
        amount: parseFloat(amount),
        token,
        fromAddress,
        toAddress,
        userSignature,
        timestamp: Date.now(),
      };

      const result = await bridgeAPI.initiateBridge(bridgeRequest);
      setBridgeStatus(result);

      // Start polling for status updates
      pollBridgeStatus(result.bridgeId);

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [ethereumAddress, stellarAddress]);

  const pollBridgeStatus = useCallback(async (bridgeId) => {
    let pollCount = 0;
    const maxPolls = 120; // 10 minutes of polling

    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        const status = await bridgeAPI.getBridgeStatus(bridgeId);
        setBridgeStatus(status);

        if (status.status === 'completed' || status.status === 'error' || pollCount >= maxPolls) {
          clearInterval(pollInterval);
          
          if (pollCount >= maxPolls && status.status === 'processing') {
            setError('Bridge transaction timed out. Please check transaction status manually.');
          }
        }
      } catch (err) {
        console.error('Status polling error:', err);
        clearInterval(pollInterval);
        setError('Failed to monitor bridge status');
      }
    }, 5000); // Poll every 5 seconds

    return pollInterval;
  }, []);

  const estimateFees = useCallback(async (fromChain, toChain, amount, token) => {
    try {
      setError(null);
      const feeEstimate = await bridgeAPI.estimateBridgeFees(fromChain, toChain, amount, token);
      setFees(feeEstimate);
      return feeEstimate;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getBridgeHistory = useCallback(async () => {
    try {
      const address = ethereumAddress || stellarAddress;
      if (!address) return;

      const history = await bridgeAPI.getBridgeHistory(address);
      setBridgeHistory(history);
      return history;
    } catch (err) {
      console.error('Failed to get bridge history:', err);
      setError(err.message);
    }
  }, [ethereumAddress, stellarAddress]);

  const resetBridge = useCallback(() => {
    setBridgeStatus(null);
    setError(null);
    setFees(null);
  }, []);

  const validateBridgeTransaction = useCallback(async (bridgeId) => {
    try {
      const validation = await bridgeAPI.validateBridgeTransaction(bridgeId);
      return validation;
    } catch (err) {
      console.error('Bridge validation failed:', err);
      throw err;
    }
  }, []);

  return {
    initiateBridge,
    estimateFees,
    getBridgeHistory,
    resetBridge,
    validateBridgeTransaction,
    isProcessing,
    bridgeStatus,
    error,
    fees,
    bridgeHistory,
  };
};