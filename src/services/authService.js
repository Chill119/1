import { connectEVMWallet, connectStellarWallet, isWalletConnected } from '../utils/walletUtils';

export const signInWithEVM = async (provider) => {
  try {
    const connection = await connectEVMWallet(provider);
    const signer = connection.provider.getSigner();
    const message = 'Sign this message to authenticate with London Blockchain Bridge';
    const signature = await signer.signMessage(message);

    return {
      account: connection.account,
      signature,
      type: 'evm',
      provider
    };
  } catch (error) {
    console.error('EVM sign-in error:', error);
    throw new Error(error.message || 'Failed to sign in with EVM wallet');
  }
};

export const signInWithStellar = async () => {
  try {
    const connection = await connectStellarWallet();
    const message = 'Sign this message to authenticate with London Blockchain Bridge';
    const signedMessage = await window.freighter.signMessage(message);

    return {
      account: connection.account,
      signature: signedMessage,
      type: 'stellar',
      provider: 'freighter'
    };
  } catch (error) {
    console.error('Stellar sign-in error:', error);
    throw new Error(error.message || 'Failed to sign in with Stellar wallet');
  }
};

export const verifyWalletConnection = async (type, provider) => {
  try {
    const isConnected = await isWalletConnected(provider);
    if (!isConnected) {
      throw new Error(`${type === 'evm' ? 'EVM' : 'Stellar'} wallet not connected`);
    }
    return true;
  } catch (error) {
    console.error('Wallet verification error:', error);
    throw error;
  }
};