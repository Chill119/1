export const CHAIN_CONFIG = {
  stellar: {
    name: 'Stellar',
    networkId: 'TESTNET',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    nativeAsset: 'XLM',
    explorerUrl: 'https://stellar.expert/explorer/testnet',
    confirmationTime: 5, // seconds
    bridgeAddress: process.env.BRIDGE_STELLAR_ADDRESS,
  },
  ethereum: {
    name: 'Ethereum',
    chainId: 11155111, // Sepolia
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    nativeAsset: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    confirmationTime: 900, // 15 minutes
    bridgeAddress: process.env.BRIDGE_EVM_ADDRESS,
  },
  base: {
    name: 'Base',
    chainId: 84531, // Base Goerli
    rpcUrl: process.env.BASE_RPC_URL,
    nativeAsset: 'ETH',
    explorerUrl: 'https://goerli.basescan.org',
    confirmationTime: 120, // 2 minutes
    bridgeAddress: process.env.BRIDGE_EVM_ADDRESS,
  },
  optimism: {
    name: 'Optimism',
    chainId: 420, // Optimism Goerli
    rpcUrl: process.env.OPTIMISM_RPC_URL,
    nativeAsset: 'ETH',
    explorerUrl: 'https://goerli-optimism.etherscan.io',
    confirmationTime: 120, // 2 minutes
    bridgeAddress: process.env.BRIDGE_EVM_ADDRESS,
  },
};

export const TOKEN_CONFIG = {
  XLM: {
    name: 'Stellar Lumens',
    decimals: 7,
    chains: ['stellar'],
    isNative: true,
  },
  ETH: {
    name: 'Ethereum',
    decimals: 18,
    chains: ['ethereum', 'base', 'optimism'],
    isNative: true,
  },
  USDC: {
    name: 'USD Coin',
    decimals: 6,
    chains: ['stellar', 'ethereum', 'base', 'optimism'],
    isNative: false,
    addresses: {
      ethereum: process.env.ETHEREUM_USDC_ADDRESS,
      base: process.env.BASE_USDC_ADDRESS,
      optimism: process.env.OPTIMISM_USDC_ADDRESS,
      stellar: process.env.STELLAR_USDC_ISSUER,
    },
  },
};

export const BRIDGE_CONFIG = {
  minAmount: 0.0001,
  maxAmount: 10000,
  bridgeFeePercent: 0.1, // 0.1%
  confirmationBlocks: {
    ethereum: 12,
    base: 1,
    optimism: 1,
    stellar: 1,
  },
  timeouts: {
    stellar: 30, // seconds
    ethereum: 300, // 5 minutes
    base: 60, // 1 minute
    optimism: 60, // 1 minute
  },
};

export const getSupportedTokensForChain = (chain) => {
  return Object.entries(TOKEN_CONFIG)
    .filter(([_, config]) => config.chains.includes(chain))
    .map(([symbol, config]) => ({ symbol, ...config }));
};

export const getChainConfig = (chain) => {
  return CHAIN_CONFIG[chain];
};

export const getTokenConfig = (token) => {
  return TOKEN_CONFIG[token];
};

export const isValidBridgeRoute = (fromChain, toChain, token) => {
  const tokenConfig = getTokenConfig(token);
  if (!tokenConfig) return false;

  return (
    tokenConfig.chains.includes(fromChain) &&
    tokenConfig.chains.includes(toChain) &&
    fromChain !== toChain
  );
};