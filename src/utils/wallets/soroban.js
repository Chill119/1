import { Networks } from 'stellar-sdk';

export const isSorobanSupported = async (wallet) => {
  try {
    return Boolean(
      wallet && 
      typeof wallet.isConnected === 'function' &&
      typeof wallet.signTransaction === 'function' &&
      typeof wallet.signMessage === 'function' &&
      typeof wallet.signAuthEntry === 'function'  // Required for Soroban auth
    );
  } catch (error) {
    console.error('Soroban support check failed:', error);
    return false;
  }
};

export const connectSorobanWallet = async () => {
  try {
    const { freighter } = window;
    if (!freighter) {
      throw new Error('No Soroban-compatible wallet detected');
    }

    const sorobanSupported = await isSorobanSupported(freighter);
    if (!sorobanSupported) {
      throw new Error('Wallet does not support Soroban');
    }

    let connected = false;
    try {
      connected = await freighter.isConnected();
    } catch (error) {
      throw new Error('Failed to check wallet connection status');
    }

    if (!connected) {
      try {
        await freighter.connect();
      } catch (error) {
        if (error.message.includes('User rejected')) {
          throw new Error('Connection rejected by user');
        }
        throw new Error('Failed to connect wallet');
      }
    }

    let publicKey;
    try {
      publicKey = await freighter.getPublicKey();
    } catch (error) {
      throw new Error('Failed to get public key');
    }

    if (!publicKey) {
      throw new Error('No public key received from wallet');
    }

    // Set network to public
    await freighter.setNetwork(Networks.PUBLIC);

    return {
      address: publicKey,
      type: 'soroban',
      provider: 'soroban',
      connected: true
    };
  } catch (error) {
    console.error('Soroban wallet connection error:', error);
    throw error;
  }
};

export const signSorobanAuthEntry = async (contractId, nonce, signatureExpirationLedger) => {
  try {
    const { freighter } = window;
    if (!freighter) {
      throw new Error('No Soroban-compatible wallet detected');
    }

    // Create auth entry for Soroban contract
    const authEntry = {
      contractId,
      nonce,
      signatureExpirationLedger
    };

    // Sign the auth entry using Freighter's Soroban support
    const signature = await freighter.signAuthEntry(authEntry);
    if (!signature) {
      throw new Error('Failed to sign auth entry');
    }

    return {
      signature,
      authEntry
    };
  } catch (error) {
    console.error('Soroban auth entry signing error:', error);
    throw error;
  }
};