import { Networks } from 'stellar-sdk';

export const authenticateWithSoroban = async (publicKey) => {
  if (!window.freighter) {
    throw new Error('Soroban-compatible wallet not found');
  }

  try {
    await window.freighter.setNetwork(Networks.PUBLIC);
    
    const message = `Sign this message to authenticate with Soroban\nNonce: ${Date.now()}`;
    const signedMessage = await window.freighter.signMessage(message);

    const response = await fetch('https://digibank.onomnibasis.com/digibank/soroban-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publicKey,
        signature: signedMessage,
        message
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Soroban authentication failed');
    }

    const data = await response.json();

    return {
      account: publicKey,
      type: 'soroban',
      signature: signedMessage,
      token: data.token
    };
  } catch (error) {
    console.error('Soroban authentication error:', error);
    throw error;
  }
};