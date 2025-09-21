import { useState, useCallback } from 'react';
import { signInWithEVM, signInWithStellar, verifyWalletConnection } from '../services/authService';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);

  const signIn = useCallback(async (type, provider = null) => {
    try {
      setIsLoading(true);
      setError(null);

      await verifyWalletConnection(type, provider);

      const authResult = type === 'evm' 
        ? await signInWithEVM(provider)
        : await signInWithStellar();

      setWalletInfo(authResult);
      setIsAuthenticated(true);
      return authResult;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
    setWalletInfo(null);
    setError(null);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    walletInfo,
    signIn,
    signOut
  };
};