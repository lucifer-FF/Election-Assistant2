/**
 * POLLING BOOTH ROUTES
 * Find polling booths, get location information
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Find polling booth
router.post('/find', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Find polling booth endpoint'
  });
});

// Get nearest polling booths
router.get('/nearest', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Get nearest polling booths'
  });
});

// Get polling booth details
router.get('/:boothId', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Get polling booth details',
    boothId: req.params.boothId
  });
});

export default router;
