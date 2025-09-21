import { STELLAR_WALLETS } from '../constants';

export const isSepWalletInstalled = (walletId) => {
  const wallet = STELLAR_WALLETS[walletId];
  if (!wallet) return false;

  // Check if wallet interface exists in window
  return typeof window[wallet.id.toLowerCase()] !== 'undefined';
};

export const connectSepWallet = async (walletId) => {
  const wallet = STELLAR_WALLETS[walletId];
  if (!wallet) {
    throw new Error(`Invalid SEP wallet: ${walletId}`);
  }

  if (!isSepWalletInstalled(walletId)) {
    window.open(wallet.url, '_blank');
    throw new Error(`${wallet.name} not installed. Please install the wallet.`);
  }

  try {
    const walletInterface = window[wallet.id.toLowerCase()];
    
    // Check if wallet requires explicit connection
    if (typeof walletInterface.connect === 'function') {
      await walletInterface.connect();
    }

    // Get public key based on wallet's method
    let publicKey;
    if (typeof walletInterface.getPublicKey === 'function') {
      publicKey = await walletInterface.getPublicKey();
    } else if (typeof walletInterface.publicKey === 'function') {
      const result = await walletInterface.publicKey();
      publicKey = result.pubkey || result.publicKey;
    } else {
      throw new Error('Unsupported wallet interface');
    }

    if (!publicKey) {
      throw new Error('No public key found');
    }

    return {
      address: publicKey,
      type: 'stellar',
      provider: walletId
    };
  } catch (error) {
    throw new Error(`${wallet.name} connection failed: ${error.message}`);
  }
};