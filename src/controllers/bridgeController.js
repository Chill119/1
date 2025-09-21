import { bridgeService } from '../services/bridge/BridgeService.js';
import { transactionValidator } from '../services/bridge/TransactionValidator.js';

export const initiateBridge = async (req, res) => {
  try {
    const bridgeRequest = req.body;
    const result = await bridgeService.initiateBridge(bridgeRequest);
    res.json(result);
  } catch (error) {
    console.error('Bridge initiation error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getBridgeStatus = async (req, res) => {
  try {
    const { bridgeId } = req.params;
    const status = await bridgeService.getBridgeStatus(bridgeId);
    res.json(status);
  } catch (error) {
    console.error('Bridge status error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const estimateBridgeFees = async (req, res) => {
  try {
    const { fromChain, toChain, amount, token } = req.body;
    const fees = await bridgeService.estimateBridgeFees(fromChain, toChain, amount, token);
    res.json(fees);
  } catch (error) {
    console.error('Fee estimation error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const validateBridge = async (req, res) => {
  try {
    const { bridgeId } = req.params;
    const bridgeData = bridgeService.bridgeTransactions.get(bridgeId);
    
    if (!bridgeData) {
      return res.status(404).json({ error: 'Bridge transaction not found' });
    }

    const validation = await transactionValidator.validateCrossChainBridge(bridgeData);
    res.json(validation);
  } catch (error) {
    console.error('Bridge validation error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getBridgeHistory = async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    // Filter bridge transactions for the user
    const userBridges = Array.from(bridgeService.bridgeTransactions.values())
      .filter(bridge => 
        bridge.fromAddress === userAddress || bridge.toAddress === userAddress
      )
      .sort((a, b) => b.timestamp - a.timestamp);

    res.json(userBridges);
  } catch (error) {
    console.error('Bridge history error:', error);
    res.status(500).json({ error: error.message });
  }
};