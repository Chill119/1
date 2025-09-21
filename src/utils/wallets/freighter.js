import { Networks } from 'stellar-sdk';

export const FREIGHTER_URL = 'https://www.freighter.app/';

export const isFreighterInstalled = () => {
  try {
    return Boolean(
      window.freighter &&
      typeof window.freighter.isConnected === 'function' &&
      typeof window.freighter.getPublicKey === 'function' &&
      typeof window.freighter.signTransaction === 'function'
    );
  } catch (error) {
    console.error('Freighter detection error:', error);
    return false;
  }
};

export const connectFreighterWallet = async () => {
  try {
    if (!isFreighterInstalled()) {
      throw new Error('Freighter wallet is not properly installed');
    }

    let connected = false;
    try {
      connected = await window.freighter.isConnected();
    } catch (error) {
      console.error('Freighter connection check error:', error);
      throw new Error('Failed to check Freighter connection status');
    }

    if (!connected) {
      try {
        await window.freighter.connect();
      } catch (error) {
        console.error('Freighter connect error:', error);
        if (error.message.includes('User rejected')) {
          throw new Error('Connection rejected by user');
        }
        throw new Error('Failed to connect to Freighter');
      }
    }

    let publicKey;
    try {
      publicKey = await window.freighter.getPublicKey();
    } catch (error) {
      console.error('Freighter public key error:', error);
      throw new Error('Failed to get Freighter public key');
    }

    if (!publicKey) {
      throw new Error('No public key received from Freighter');
    }

    try {
      await window.freighter.setNetwork(Networks.PUBLIC);
    } catch (error) {
      console.error('Freighter network error:', error);
      throw new Error('Failed to set Freighter network');
    }

    return {
      address: publicKey,
      type: 'stellar',
      provider: 'freighter',
      connected: true
    };
  } catch (error) {
    console.error('Freighter wallet error:', error);
    throw error;
  }
};