import { ethers } from 'ethers';
import { CHAIN_IDS } from '../constants';

export const isCoinbaseWalletInstalled = () => {
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isCoinbaseWallet);
};

export const connectCoinbaseWallet = async (chainType) => {
  if (!isCoinbaseWalletInstalled()) {
    throw new Error('Coinbase Wallet not installed');
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found');
    }

    if (chainType !== 'ethereum') {
      await switchChain(chainType);
    }

    const network = await provider.getNetwork();
    
    return {
      address: accounts[0],
      type: chainType,
      provider,
      chainId: '0x' + network.chainId.toString(16)
    };
  } catch (error) {
    throw new Error(`Coinbase Wallet connection failed: ${error.message}`);
  }
};

export const switchChain = async (chainType) => {
  const chainId = CHAIN_IDS[chainType];
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId,
            chainName: getChainName(chainType),
            nativeCurrency: getChainCurrency(chainType),
            rpcUrls: [getRpcUrl(chainType)],
            blockExplorerUrls: [getExplorerUrl(chainType)]
          }],
        });
      } catch (addError) {
        throw new Error(`Failed to add chain: ${addError.message}`);
      }
    } else {
      throw new Error(`Failed to switch chain: ${switchError.message}`);
    }
  }
};

export const getProvider = () => {
  if (!isCoinbaseWalletInstalled()) {
    throw new Error('Coinbase Wallet not installed');
  }
  return new ethers.providers.Web3Provider(window.ethereum);
};

const getChainName = (chainType) => {
  const names = {
    ethereum: 'Ethereum Mainnet',
    base: 'Base',
    optimism: 'Optimism'
  };
  return names[chainType] || 'Unknown Chain';
};

const getChainCurrency = (chainType) => {
  return { name: 'ETH', symbol: 'ETH', decimals: 18 };
};

const getRpcUrl = (chainType) => {
  const urls = {
    ethereum: process.env.ETHEREUM_RPC_URL,
    base: process.env.BASE_RPC_URL,
    optimism: process.env.OPTIMISM_RPC_URL
  };
  return urls[chainType] || '';
};

const getExplorerUrl = (chainType) => {
  const urls = {
    ethereum: 'https://etherscan.io',
    base: 'https://basescan.org',
    optimism: 'https://optimistic.etherscan.io'
  };
  return urls[chainType] || '';
};