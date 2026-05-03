/**
 * CANDIDATE ROUTES
 * Candidate search, information, comparison
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all candidates
router.get('/', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Get candidates endpoint'
  });
});

// Get candidates by constituency
router.get('/constituency/:partNo', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Get candidates by constituency',
    partNo: req.params.partNo
  });
});

// Get candidate details
router.get('/:candidateId', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Get candidate details',
    candidateId: req.params.candidateId
  });
});

// Compare candidates
router.post('/compare', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Compare candidates endpoint'
  });
});

export default router;
