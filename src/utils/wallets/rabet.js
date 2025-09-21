export const isRabetInstalled = () => {
  return typeof window.rabet !== 'undefined';
};

export const connectRabetWallet = async () => {
  if (!isRabetInstalled()) {
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