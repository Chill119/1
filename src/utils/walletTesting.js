import { detectWalletType, connectEVMWallet, connectStellarWallet } from './walletUtils';

export const testWalletDetection = async () => {
  const results = {
    evm: {
      metamask: await detectWalletType('metamask'),
      coinbase: await detectWalletType('coinbase')
    },
    stellar: {}
  };

  // Test Stellar wallets
  for (const wallet of ['FREIGHTER', 'ALBEDO', 'RABET', 'XBULL', 'LOBSTR']) {
    results.stellar[wallet] = await detectWalletType(wallet);
  }

  return results;
};

export const testWalletConnection = async () => {
  const results = {
    evm: {},
    stellar: {}
  };

  // Test EVM wallets
  try {
    results.evm.metamask = await connectEVMWallet('ethereum', 'metamask');
  } catch (error) {
    results.evm.metamask = { error: error.message };
  }

  try {
    results.evm.coinbase = await connectEVMWallet('ethereum', 'coinbase');
  } catch (error) {
    results.evm.coinbase = { error: error.message };
  }

  // Test Stellar wallets
  for (const wallet of ['FREIGHTER', 'ALBEDO', 'RABET', 'XBULL', 'LOBSTR']) {
    try {
      results.stellar[wallet] = await connectStellarWallet(wallet);
    } catch (error) {
      results.stellar[wallet] = { error: error.message };
    }
  }

  return results;
};