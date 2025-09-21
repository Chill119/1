export class BridgeAPI {
  constructor() {
    this.baseUrl = '/api/bridge';
  }

  async initiateBridge(bridgeRequest) {
    try {
      // Validate request locally first
      this.validateBridgeRequest(bridgeRequest);

      const response = await fetch(`${this.baseUrl}/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bridgeRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Bridge initiation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Bridge API error:', error);
      throw error;
    }
  }

  async getBridgeStatus(bridgeId) {
    try {
      const response = await fetch(`${this.baseUrl}/status/${bridgeId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get bridge status');
      }

      return await response.json();
    } catch (error) {
      console.error('Bridge status API error:', error);
      throw error;
    }
  }

  async estimateBridgeFees(fromChain, toChain, amount, token) {
    try {
      const response = await fetch(`${this.baseUrl}/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fromChain, toChain, amount, token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Fee estimation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Fee estimation API error:', error);
      throw error;
    }
  }

  async validateBridgeTransaction(bridgeId) {
    try {
      const response = await fetch(`${this.baseUrl}/validate/${bridgeId}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Validation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Bridge validation API error:', error);
      throw error;
    }
  }

  async getBridgeHistory(userAddress) {
    try {
      const response = await fetch(`${this.baseUrl}/history/${userAddress}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get bridge history');
      }

      return await response.json();
    } catch (error) {
      console.error('Bridge history API error:', error);
      throw error;
    }
  }

  validateBridgeRequest(request) {
    const { fromChain, toChain, amount, token, fromAddress, toAddress } = request;

    if (!fromChain || !toChain) {
      throw new Error('Source and destination chains are required');
    }

    if (fromChain === toChain) {
      throw new Error('Source and destination chains must be different');
    }

    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Valid amount is required');
    }

    if (!token) {
      throw new Error('Token is required');
    }

    if (!fromAddress || !toAddress) {
      throw new Error('Source and destination addresses are required');
    }

    // Validate addresses format
    if (fromChain === 'stellar' && !this.isValidStellarAddress(fromAddress)) {
      throw new Error('Invalid Stellar source address');
    }

    if (toChain === 'stellar' && !this.isValidStellarAddress(toAddress)) {
      throw new Error('Invalid Stellar destination address');
    }

    if (fromChain !== 'stellar' && !this.isValidEthereumAddress(fromAddress)) {
      throw new Error('Invalid Ethereum source address');
    }

    if (toChain !== 'stellar' && !this.isValidEthereumAddress(toAddress)) {
      throw new Error('Invalid Ethereum destination address');
    }
  }

  isValidStellarAddress(address) {
    return /^G[A-Z0-9]{55}$/.test(address);
  }

  isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

export const bridgeAPI = new BridgeAPI();