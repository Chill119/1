export const isAlbedoInstalled = () => {
  return typeof window.albedo !== 'undefined';
};

export const connectAlbedoWallet = async () => {
  if (!isAlbedoInstalled()) {
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