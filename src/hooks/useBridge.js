import { useState, useCallback, useEffect } from 'react';
import { bridgeService } from '../services/bridge/BridgeService';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export const useBridge = () => {
  const { ethereumAddress, stellarAddress } = useAppContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState(null);
  const [error, setError] = useState(null);
  const [fees, setFees] = useState(null);
  const [bridgeHistory, setBridgeHistory] = useState([]);

  useEffect(() => {
    let subscription = null;

    const setupRealtimeSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        subscription = supabase
          .channel('bridge_transactions_realtime')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'bridge_transactions',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const updatedBridge = payload.new;

              if (bridgeStatus && bridgeStatus.bridgeId === updatedBridge.bridge_id) {
                setBridgeStatus({
                  bridgeId: updatedBridge.bridge_id,
                  status: updatedBridge.status,
                  fromChain: updatedBridge.from_chain,
                  toChain: updatedBridge.to_chain,
                  amount: updatedBridge.amount,
                  token: updatedBridge.token,
                  stellarTxHash: updatedBridge.stellar_tx_hash,
                  sourceTxHash: updatedBridge.source_tx_hash,
                  targetTxHash: updatedBridge.target_tx_hash,
                });
              }

              setBridgeHistory(prev => {
                const index = prev.findIndex(b => b.bridgeId === updatedBridge.bridge_id);
                if (index !== -1) {
                  const updated = [...prev];
                  updated[index] = {
                    bridgeId: updatedBridge.bridge_id,
                    fromChain: updatedBridge.from_chain,
                    toChain: updatedBridge.to_chain,
                    fromAddress: updatedBridge.from_address,
                    toAddress: updatedBridge.to_address,
                    amount: updatedBridge.amount,
                    token: updatedBridge.token,
                    status: updatedBridge.status,
                    stellarTxHash: updatedBridge.stellar_tx_hash,
                    sourceTxHash: updatedBridge.source_tx_hash,
                    targetTxHash: updatedBridge.target_tx_hash,
                    timestamp: new Date(updatedBridge.created_at).getTime(),
                  };
                  return updated;
                }
                return prev;
              });
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Failed to setup realtime subscription:', err);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [bridgeStatus]);

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

      // Create bridge request
      const bridgeRequest = {
        fromChain,
        toChain,
        amount: parseFloat(amount),
        token,
        fromAddress,
        toAddress,
        userSignature: 'mock_signature_' + Date.now(),
        timestamp: Date.now(),
      };

      const result = await bridgeService.initiateBridge(bridgeRequest);
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
        const status = await bridgeService.getBridgeStatus(bridgeId);
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
      const feeEstimate = await bridgeService.estimateBridgeFees(fromChain, toChain, amount, token);
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

      const history = await bridgeService.getBridgeHistory(address);
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

  return {
    initiateBridge,
    estimateFees,
    getBridgeHistory,
    resetBridge,
    isProcessing,
    bridgeStatus,
    error,
    fees,
    bridgeHistory,
  };
};