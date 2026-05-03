/**
 * CHATBOT ROUTES
 * Gemini-backed election assistant endpoint
 */

import express from 'express';
import axios from 'axios';
import Joi from 'joi';
import { logger } from '../config/logger.js';
import {
  getOfficialGuidance,
  getVerifiedCandidates,
  getVerifiedNews,
  getVerifiedPollingBooths,
  getVerifiedSchedule
} from '../services/verifiedDataService.js';

const router = express.Router();

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_API_BASE = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta';
const CHATBOT_TIMEOUT_MS = Number(process.env.CHATBOT_TIMEOUT_MS || 12000);
const CHATBOT_MAX_RETRIES = Number(process.env.CHATBOT_MAX_RETRIES || 2);
const MAX_CONTEXT_MESSAGES = Number(process.env.CHATBOT_MAX_CONTEXT_MESSAGES || 12);

function fallbackMessage() {
  return 'Data could not be verified from configured official sources. Please refine your query or try again later.';
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((entry) => ({
      role: entry?.role === 'assistant' || entry?.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(entry?.text || '').slice(0, 1500) }]
    }))
    .filter((entry) => entry.parts[0].text.trim().length > 0);
}

const messageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(2500).required(),
  language: Joi.string().trim().valid('en', 'hi', 'bn').optional(),
  constituency: Joi.string().trim().max(120).optional(),
  state: Joi.string().trim().max(120).optional(),
  history: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid('user', 'assistant', 'model').required(),
        text: Joi.string().allow('').max(1500).required()
      })
    )
    .optional()
});

async function retrieveVerifiedContext({ message, constituency, state }) {
  const q = String(message || '').toLowerCase();
  const shouldFetchCandidates = q.includes('candidate') || q.includes('manifesto') || q.includes('party') || Boolean(constituency);
  const shouldFetchSchedule = q.includes('schedule') || q.includes('date') || q.includes('phase') || q.includes('timeline');
  const shouldFetchBooths = q.includes('booth') || q.includes('polling') || q.includes('station');
  const shouldFetchNews = q.includes('news') || q.includes('update') || q.includes('alert');

  const [guidance, candidates, schedule, pollingBooths, news] = await Promise.all([
    Promise.resolve(getOfficialGuidance()),
    shouldFetchCandidates ? getVerifiedCandidates({ constituency }) : Promise.resolve(null),
    shouldFetchSchedule ? getVerifiedSchedule({ state }) : Promise.resolve(null),
    shouldFetchBooths ? getVerifiedPollingBooths({ constituency }) : Promise.resolve(null),
    shouldFetchNews ? getVerifiedNews() : Promise.resolve(null)
  ]);

  const retrieved = [candidates, schedule, pollingBooths, news].filter(Boolean);
  const sources = [];
  const facts = [];

  if (guidance?.items?.length) {
    facts.push(...guidance.items.slice(0, 4).map((g) => ({ type: 'guidance', title: g.title, summary: g.summary, source: g.source })));
    if (Array.isArray(guidance.sources)) sources.push(...guidance.sources);
  }

  for (const section of retrieved) {
    if (section?.verified && Array.isArray(section.items) && section.items.length > 0) {
      facts.push(...section.items.slice(0, 5).map((item) => ({ type: section.type || 'dataset', ...item })));
      if (section.source) sources.push({ name: section.type || 'dataset', url: section.source });
    }
  }

  return {
    facts,
    sources: sources.filter((s, idx, arr) => s?.url && arr.findIndex((x) => x.url === s.url) === idx)
  };
}

async function requestGemini(payload, traceId) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing in backend environment');
  }

  const endpoint = `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent`;
  let lastError;

  for (let attempt = 0; attempt <= CHATBOT_MAX_RETRIES; attempt += 1) {
    try {
      const response = await axios.post(endpoint, payload, {
        params: { key: apiKey },
        timeout: CHATBOT_TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      const shouldRetry = !status || status >= 500 || status === 429;

      logger.error('Chatbot Gemini request failed', {
        traceId,
        attempt: attempt + 1,
        status,
        message: error?.message,
        response: error?.response?.data
      });

      if (!shouldRetry || attempt >= CHATBOT_MAX_RETRIES) {
        break;
      }

      const backoffMs = 350 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
}

router.post('/message', async (req, res) => {
  const traceId = req.headers['x-trace-id'] || `trace_${Date.now()}`;
  const { error, value } = messageSchema.validate(req.body || {});
  if (error) {
    return res.status(400).json({ success: false, error: error.message, traceId });
  }
  const message = value.message;
  const language = value.language || 'en';
  const history = sanitizeHistory(value.history);

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required',
      traceId
    });
  }

  const context = await retrieveVerifiedContext({
    message,
    constituency: value.constituency,
    state: value.state
  });

  if (!context.facts.length) {
    return res.status(200).json({
      success: false,
      reply: fallbackMessage(),
      verification: {
        status: 'unavailable',
        sources: context.sources,
        lastUpdated: new Date().toISOString()
      },
      traceId
    });
  }

  const contents = [...history, { role: 'user', parts: [{ text: message.slice(0, 2500) }] }];
  const payload = {
    contents,
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 512
    },
    systemInstruction: {
      role: 'system',
      parts: [{
        text: `You are a strict civic assistant. Respond ONLY using provided VERIFIED_CONTEXT facts.
If details are missing, say: "Data could not be verified."
Never invent names, dates, polling booths, results, statistics, or schedules.
Answer in language code "${language}".
Include sources exactly from the context.`
      }]
    },
    tools: [],
    cachedContent: undefined
  };

  payload.contents.unshift({
    role: 'user',
    parts: [{
      text: `VERIFIED_CONTEXT:\n${JSON.stringify(context, null, 2)}`
    }]
  });

  try {
    const data = await requestGemini(payload, traceId);
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!answer) {
      logger.warn('Chatbot empty AI response', { traceId, data });
      return res.status(502).json({
        success: false,
        error: 'Empty response from AI provider',
        fallback: fallbackMessage(message),
        traceId
      });
    }

    return res.json({
      success: true,
      reply: answer,
      verification: {
        status: 'verified',
        sources: context.sources,
        lastUpdated: new Date().toISOString()
      },
      traceId
    });
  } catch (error) {
    logger.error('Chatbot message handler failed', {
      traceId,
      message: error?.message,
      status: error?.response?.status,
      providerResponse: error?.response?.data
    });

    return res.status(502).json({
      success: false,
      error: 'Chatbot service temporarily unavailable or unverified',
      fallback: fallbackMessage(),
      verification: {
        status: 'unavailable',
        sources: context?.sources || [],
        lastUpdated: new Date().toISOString()
      },
      traceId
    });
  }
});

export default router;
