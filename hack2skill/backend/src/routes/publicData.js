import express from 'express';
import Joi from 'joi';
import {
  getOfficialGuidance,
  getVerifiedCandidates,
  getVerifiedNews,
  getVerifiedPollingBooths,
  getVerifiedSchedule
} from '../services/verifiedDataService.js';

const router = express.Router();

const querySchema = Joi.object({
  state: Joi.string().trim().max(80).optional(),
  constituency: Joi.string().trim().max(120).optional(),
  q: Joi.string().trim().max(200).optional()
});

function validateQuery(req, res, next) {
  const { error, value } = querySchema.validate(req.query || {});
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Invalid query parameters: ${error.message}`
    });
  }
  req.query = value;
  next();
}

router.get('/news', validateQuery, async (req, res) => {
  const payload = await getVerifiedNews();
  res.json({ success: payload.verified, ...payload });
});

router.get('/candidates', validateQuery, async (req, res) => {
  const payload = await getVerifiedCandidates(req.query);
  res.json({ success: payload.verified, ...payload });
});

router.get('/schedule', validateQuery, async (req, res) => {
  const payload = await getVerifiedSchedule(req.query);
  res.json({ success: payload.verified, ...payload });
});

router.get('/polling-booths', validateQuery, async (req, res) => {
  const payload = await getVerifiedPollingBooths(req.query);
  res.json({ success: payload.verified, ...payload });
});

router.get('/guidance', (req, res) => {
  const payload = getOfficialGuidance();
  res.json({ success: true, ...payload });
});

export default router;
