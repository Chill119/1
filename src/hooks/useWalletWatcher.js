import { useState, useEffect } from 'react';
import { WALLET_URLS } from '../utils/constants';

export const useWalletWatcher = () => {
  const [isWatching, setIsWatching] = useState(false);
  const [isFreighterDetected, setIsFreighterDetected] = useState(false);
  const [checkInterval, setCheckInterval] = useState(null);

  useEffect(() => {
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [checkInterval]);

  const startWatching = () => {
    if (isWatching) return;

    const interval = setInterval(async () => {
      if (typeof window.freighter !== 'undefined') {
        try {
          const isAvailable = await window.freighter.isAvailable();
          if (isAvailable) {
            setIsFreighterDetected(true);
            clearInterval(interval);
            setCheckInterval(null);
            setIsWatching(false);
          }
        } catch (err) {
          console.warn('Freighter check warning:', err);
        }
      }
    }, 1000);

    setCheckInterval(interval);
    setIsWatching(true);

    // Set a timeout to stop watching after 2 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setCheckInterval(null);
        setIsWatching(false);
      }
    }, 120000);
  };

  const stopWatching = () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      setCheckInterval(null);
    }
    setIsWatching(false);
  };

  return {
    isWatching,
    isFreighterDetected,
    startWatching,
    stopWatching
  };
};