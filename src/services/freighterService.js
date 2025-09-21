import { 
  isConnected, 
  isAllowed, 
  setAllowed, 
  getPublicKey, 
  getNetwork,
  signTransaction,
  signMessage
} from '@stellar/freighter-api';

export const checkFreighterInstallation = async () => {
  try {
    // Try to call a Freighter API method to check if it's available
    await isConnected();
    return true;
  } catch (error) {
    console.warn('Freighter not available:', error);
    return false;
  }
};

export const connectFreighter = async () => {
  try {
    // Check if Freighter is installed
    const isInstalled = await checkFreighterInstallation();
    if (!isInstalled) {
      throw new Error('Please install Freighter wallet extension first');
    }
    
    // Check if already connected
    const connected = await isConnected();
    if (!connected) {
      // Request permission - this opens Freighter popup
      await setAllowed();
    }
    
    // Verify user granted permission
    const allowed = await isAllowed();
    if (!allowed) {
      throw new Error('Please allow access to Freighter wallet');
    }
    
    // Get public key
    const publicKey = await getPublicKey();
    if (!publicKey) {
      throw new Error('Failed to retrieve public key from Freighter');
    }

    // Get network information
    const network = await getNetwork();

    return {
      publicKey,
      network,
      isConnected: true
    };
  } catch (error) {
    console.error('Freighter connection failed:', error);
    
    // Handle specific error cases
    if (error.message?.includes('User declined access')) {
      throw new Error('Connection rejected by user');
    } else if (error.message?.includes('Freighter is locked')) {
      throw new Error('Please unlock Freighter wallet');
    }
    
    throw error;
  }
};

export const signStellarTransaction = async (xdr, opts = {}) => {
  try {
    const signedXDR = await signTransaction(xdr, opts);
    return signedXDR;
  } catch (error) {
    console.error('Transaction signing failed:', error);
    throw new Error('Failed to sign transaction');
  }
};

export const signStellarMessage = async (message) => {
  try {
    const signature = await signMessage(message);
    return signature;
  } catch (error) {
    console.error('Message signing failed:', error);
    throw new Error('Failed to sign message');
  }
};

export const getFreighterNetwork = async () => {
  try {
    const network = await getNetwork();
    return network;
  } catch (error) {
    console.error('Failed to get network:', error);
    throw new Error('Failed to get network information');
  }
};

export const getFreighterPublicKey = async () => {
  try {
    const publicKey = await getPublicKey();
    return publicKey;
  } catch (error) {
    console.error('Failed to get public key:', error);
    throw new Error('Failed to get public key');
  }
};