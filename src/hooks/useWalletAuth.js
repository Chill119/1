import { useState, useCallback } from 'react';
import { verifyWalletSignature } from '../utils/walletUtils';

export const useWalletAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);

  const signAndVerify = useCallback(async (message, address, type, signer) => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      let signature;
      
      if (type === 'stellar') {
        signature = await window.freighter.signTransaction(
          message,
          address
        );
      } else {
        signature = await signer.signMessage(message);
      }

      const isValid = await verifyWalletSignature(message, signature, address, type);
      
      if (!isValid) {
        throw new Error('Invalid signature');
      }

      return { signature, isValid };
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  return {
    isAuthenticating,
    authError,
    signAndVerify
  };
};