import { STELLAR_WALLETS } from '../constants';
import { connectSepWallet } from './sep';

const checkExtensionInstalled = async (extensionId) => {
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
    return false;
  }

  try {
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(extensionId, { type: 'PING' }, response => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
    return true;
  } catch {
    return false;
  }
};

const connectFreighterWallet = async () => {
  if (typeof window.freighter === 'undefined') {
    throw new Error('Freighter not installed');
  }

  try {
    const connected = await window.freighter.isConnected();
    if (!connected) {
      await window.freighter.connect();
    }

    const publicKey = await window.freighter.getPublicKey();
    if (!publicKey) {
      throw new Error('No public key found');
    }

    return {
      address: publicKey,
      type: 'stellar',
      provider: 'FREIGHTER'
    };
  } catch (error) {
    throw new Error(`Freighter connection failed: ${error.message}`);
  }
};

const connectAlbedoWallet = async () => {
  if (typeof window.albedo === 'undefined') {
    throw new Error('Albedo not installed');
  }

  try {
    const { pubkey } = await window.albedo.publicKey();
    return {
      address: pubkey,
      type: 'stellar',
      provider: 'ALBEDO'
    };
  } catch (error) {
    throw new Error(`Albedo connection failed: ${error.message}`);
  }
};

const connectRabetWallet = async () => {
  if (typeof window.rabet === 'undefined') {
    throw new Error('Rabet not installed');
  }

  try {
    const { publicKey } = await window.rabet.connect();
    return {
      address: publicKey,
      type: 'stellar',
      provider: 'RABET'
    };
  } catch (error) {
    throw new Error(`Rabet connection failed: ${error.message}`);
  }
};

const connectLobstrWallet = async () => {
  return new Promise((resolve, reject) => {
    const extensionId = STELLAR_WALLETS.LOBSTR.extensionId;

    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      reject(new Error('Chrome extension API not available'));
      return;
    }

    chrome.runtime.sendMessage(
      extensionId,
      { type: 'REQUEST_PUBLIC_KEY' },
      response => {
        if (chrome.runtime.lastError) {
          reject(new Error('LOBSTR extension not responding'));
          return;
        }

        if (response && response.publicKey) {
          resolve({
            address: response.publicKey,
            type: 'stellar',
            provider: 'LOBSTR'
          });
        } else {
          reject(new Error('Failed to get public key from LOBSTR wallet'));
        }
      }
    );

    setTimeout(() => {
      reject(new Error('LOBSTR connection timed out'));
    }, 5000);
  });
};

export const connectStellarWallet = async (providerId) => {
  const wallet = STELLAR_WALLETS[providerId];
  if (!wallet) {
    throw new Error(`Invalid Stellar wallet provider: ${providerId}`);
  }

  try {
    // Handle SEP wallets
    if (wallet.type === 'sep') {
      return connectSepWallet(providerId);
    }

    // Handle extension wallets
    const isInstalled = await checkExtensionInstalled(wallet.extensionId);
    if (!isInstalled) {
      window.open(wallet.url, '_blank');
      throw new Error(`${wallet.name} not installed. Please install the wallet extension.`);
    }

    switch (providerId) {
      case 'FREIGHTER':
        return connectFreighterWallet();
      case 'ALBEDO':
        return connectAlbedoWallet();
      case 'RABET':
        return connectRabetWallet();
      case 'LOBSTR':
        return connectLobstrWallet();
      default:
        throw new Error(`${wallet.name} connection not implemented`);
    }
  } catch (error) {
    throw new Error(`Failed to connect ${wallet.name}: ${error.message}`);
  }
};