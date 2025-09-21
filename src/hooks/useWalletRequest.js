import { useState, useCallback } from 'react';

export const useWalletRequest = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const executeRequest = useCallback(async (requestFn) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    try {
      const result = await requestFn();
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  return {
    isProcessing,
    executeRequest
  };
};