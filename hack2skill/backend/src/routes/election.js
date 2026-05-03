/**
 * ELECTION INFORMATION ROUTES
 * Election timeline, schedules, information
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getVerifiedSchedule } from '../services/verifiedDataService.js';

const router = express.Router();

// Get election timeline
router.get('/timeline', authenticate, async (req, res) => {
  const payload = await getVerifiedSchedule({ state: req.query?.state });
  res.json({
    success: payload.verified,
    ...payload
  });
});

// Get election results
router.get('/results', authenticate, (_req, res) => {
  res.json({
    success: false,
    status: 'unavailable',
    message: 'Live data currently unavailable'
  });
});

// Get voting statistics
router.get('/statistics', authenticate, (_req, res) => {
  res.json({
    success: false,
    status: 'unavailable',
    message: 'Live data currently unavailable'
  });
});

export default router;
