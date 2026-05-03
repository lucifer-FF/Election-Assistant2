import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import Joi from 'joi';
import NodeCache from 'node-cache';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATASET_PATH = path.join(__dirname, '../data/verified-datasets.json');
const cache = new NodeCache({ stdTTL: 120, checkperiod: 60 });

const providerResponseSchema = Joi.object({
  items: Joi.array().required(),
  source: Joi.string().uri().required(),
  fetchedAt: Joi.string().isoDate().required()
});

function readLocalDataset() {
  try {
    const content = fs.readFileSync(DATASET_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logger.error('Failed to load verified local dataset', { error: error.message });
    return {
      meta: { sources: [], updatedAt: new Date().toISOString() },
      officialGuidance: [],
      schedule: [],
      candidates: [],
      pollingBooths: [],
      news: []
    };
  }
}

function verifyProviderPayload(payload, sourceUrl) {
  const wrapper = {
    items: Array.isArray(payload) ? payload : payload?.items || [],
    source: sourceUrl,
    fetchedAt: new Date().toISOString()
  };
  const { error, value } = providerResponseSchema.validate(wrapper);
  if (error) {
    throw new Error(`Provider payload schema validation failed: ${error.message}`);
  }
  return value;
}

async function fetchFromProvider(cacheKey, url, transformFn = (x) => x) {
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (!url) return null;

  const response = await axios.get(url, { timeout: Number(process.env.DATA_FETCH_TIMEOUT_MS || 8000) });
  const transformed = transformFn(response.data);
  const verified = verifyProviderPayload(transformed, url);
  cache.set(cacheKey, verified, Number(process.env.DATA_CACHE_TTL_SECONDS || 180));
  return verified;
}

function buildUnavailable(type, localDataset) {
  return {
    verified: false,
    status: 'unavailable',
    message: 'Live data currently unavailable',
    type,
    lastUpdated: localDataset?.meta?.updatedAt || new Date().toISOString(),
    source: null,
    items: []
  };
}

export async function getVerifiedNews() {
  const localDataset = readLocalDataset();
  try {
    let newsUrl = process.env.VERIFIED_NEWS_API_URL;
    if (!newsUrl && process.env.NEWS_API_KEY) {
      const q = encodeURIComponent(process.env.NEWS_API_QUERY || 'India election commission OR election');
      const language = encodeURIComponent(process.env.NEWS_API_LANGUAGE || 'en');
      newsUrl = `https://newsapi.org/v2/everything?q=${q}&language=${language}&sortBy=publishedAt&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`;
    }

    const provider = await fetchFromProvider(
      'verified-news',
      newsUrl,
      (payload) => (Array.isArray(payload?.articles) ? payload.articles : payload)
    );
    if (!provider) {
      if (Array.isArray(localDataset.news) && localDataset.news.length > 0) {
        return {
          verified: true,
          status: 'ok',
          source: 'local-verified-dataset',
          lastUpdated: localDataset.meta.updatedAt,
          items: localDataset.news
        };
      }
      return buildUnavailable('news', localDataset);
    }

    return {
      verified: true,
      status: 'ok',
      source: provider.source,
      lastUpdated: provider.fetchedAt,
      items: provider.items
    };
  } catch (error) {
    logger.error('Verified news retrieval failed', { error: error.message });
    return buildUnavailable('news', localDataset);
  }
}

export async function getVerifiedCandidates(query = {}) {
  const localDataset = readLocalDataset();
  try {
    const provider = await fetchFromProvider(
      `verified-candidates-${query.constituency || 'all'}`,
      process.env.VERIFIED_CANDIDATES_API_URL
    );

    if (!provider) {
      const local = Array.isArray(localDataset.candidates) ? localDataset.candidates : [];
      const filtered = query.constituency ? local.filter((c) => c.constituency === query.constituency) : local;
      if (filtered.length === 0) return buildUnavailable('candidates', localDataset);
      return {
        verified: true,
        status: 'ok',
        source: 'local-verified-dataset',
        lastUpdated: localDataset.meta.updatedAt,
        items: filtered
      };
    }

    const filtered = query.constituency
      ? provider.items.filter((c) => String(c.constituency || '').toLowerCase() === String(query.constituency).toLowerCase())
      : provider.items;
    return {
      verified: true,
      status: 'ok',
      source: provider.source,
      lastUpdated: provider.fetchedAt,
      items: filtered
    };
  } catch (error) {
    logger.error('Verified candidate retrieval failed', { error: error.message });
    return buildUnavailable('candidates', localDataset);
  }
}

export async function getVerifiedSchedule(query = {}) {
  const localDataset = readLocalDataset();
  try {
    const provider = await fetchFromProvider('verified-schedule', process.env.VERIFIED_SCHEDULE_API_URL);
    if (!provider) {
      const local = Array.isArray(localDataset.schedule) ? localDataset.schedule : [];
      const filtered = query.state ? local.filter((s) => s.state === query.state) : local;
      if (filtered.length === 0) return buildUnavailable('schedule', localDataset);
      return {
        verified: true,
        status: 'ok',
        source: 'local-verified-dataset',
        lastUpdated: localDataset.meta.updatedAt,
        items: filtered
      };
    }

    return {
      verified: true,
      status: 'ok',
      source: provider.source,
      lastUpdated: provider.fetchedAt,
      items: provider.items
    };
  } catch (error) {
    logger.error('Verified schedule retrieval failed', { error: error.message });
    return buildUnavailable('schedule', localDataset);
  }
}

export async function getVerifiedPollingBooths(query = {}) {
  const localDataset = readLocalDataset();
  try {
    const provider = await fetchFromProvider(
      `verified-booths-${query.constituency || 'all'}`,
      process.env.VERIFIED_POLLING_BOOTH_API_URL
    );
    if (!provider) {
      const local = Array.isArray(localDataset.pollingBooths) ? localDataset.pollingBooths : [];
      const filtered = query.constituency ? local.filter((b) => b.constituency === query.constituency) : local;
      if (filtered.length === 0) return buildUnavailable('pollingBooths', localDataset);
      return {
        verified: true,
        status: 'ok',
        source: 'local-verified-dataset',
        lastUpdated: localDataset.meta.updatedAt,
        items: filtered
      };
    }
    return {
      verified: true,
      status: 'ok',
      source: provider.source,
      lastUpdated: provider.fetchedAt,
      items: provider.items
    };
  } catch (error) {
    logger.error('Verified booth retrieval failed', { error: error.message });
    return buildUnavailable('pollingBooths', localDataset);
  }
}

export function getOfficialGuidance() {
  const localDataset = readLocalDataset();
  return {
    verified: true,
    status: 'ok',
    source: 'local-verified-dataset',
    lastUpdated: localDataset?.meta?.updatedAt || new Date().toISOString(),
    items: Array.isArray(localDataset.officialGuidance) ? localDataset.officialGuidance : [],
    sources: Array.isArray(localDataset?.meta?.sources) ? localDataset.meta.sources : []
  };
}
