function getBaseUrl() {
  if (window.APP_CONFIG?.apiUrl) {
    return window.APP_CONFIG.apiUrl.replace(/\/$/, '');
  }
  const host = window.location.hostname || 'localhost';
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${host}:3000/api`;
}

async function fetchJson(path) {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    headers: { 'Content-Type': 'application/json' }
  });
  let data = {};
  try {
    data = await response.json();
  } catch (_e) {
    data = {};
  }
  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }
  return data;
}

export async function getVerifiedNews() {
  return fetchJson('/public/news');
}

export async function getVerifiedCandidates(constituency = '') {
  const query = constituency ? `?constituency=${encodeURIComponent(constituency)}` : '';
  return fetchJson(`/public/candidates${query}`);
}

export async function getVerifiedSchedule(state = '') {
  const query = state ? `?state=${encodeURIComponent(state)}` : '';
  return fetchJson(`/public/schedule${query}`);
}

export async function getOfficialGuidance() {
  return fetchJson('/public/guidance');
}
