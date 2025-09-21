import express from 'express';
import { 
  initiateBridge, 
  getBridgeStatus, 
  estimateBridgeFees,
  validateBridge,
  getBridgeHistory
} from '../controllers/bridgeController.js';

const router = express.Router();

router.post('/initiate', initiateBridge);
router.get('/status/:bridgeId', getBridgeStatus);
router.post('/estimate', estimateBridgeFees);
router.get('/validate/:bridgeId', validateBridge);
router.get('/history/:userAddress', getBridgeHistory);

export default router;