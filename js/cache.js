const CACHE_KEY = 'sport-locations-cache-v1';
const LAST_LEAGUE_KEY = 'sport-locations-last-league-v1';
const CUSTOM_LEAGUES_KEY = 'sport-locations-custom-leagues-v1';

function safeRead(key) {
  try {
    return window.localStorage.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage może być niedostępne w niektórych środowiskach.
  }
}

export function readSessionCache() {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeSessionCache(cache) {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // W przypadku ograniczeń przeglądarki pomijamy zapis cache.
  }
}

export function getCachedLeagueData(leagueId) {
  const cache = readSessionCache();
  return cache[leagueId] ?? null;
}

export function setCachedLeagueData(leagueId, data) {
  const cache = readSessionCache();
  cache[leagueId] = data;
  writeSessionCache(cache);
}

export function clearCachedLeagueData(leagueId) {
  const cache = readSessionCache();
  delete cache[leagueId];
  writeSessionCache(cache);
}

export function getLastSelectedLeague() {
  const saved = safeRead(LAST_LEAGUE_KEY);
  return saved || null;
}

export function setLastSelectedLeague(leagueId) {
  if (!leagueId) return;
  safeWrite(LAST_LEAGUE_KEY, leagueId);
}

export function getCustomLeagues() {
  try {
    const raw = window.sessionStorage.getItem(CUSTOM_LEAGUES_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

export function setCustomLeagues(customLeagues) {
  try {
    window.sessionStorage.setItem(CUSTOM_LEAGUES_KEY, JSON.stringify(customLeagues || {}));
  } catch {
    // Ignorujemy nieudany zapis custom lig.
  }
}

export function clearLeagueCache() {
  try {
    window.sessionStorage.removeItem(CACHE_KEY);
    window.sessionStorage.removeItem(CUSTOM_LEAGUES_KEY);
  } catch {
    // Ignorujemy ograniczenia przeglądarki.
  }

  try {
    window.localStorage.removeItem(LAST_LEAGUE_KEY);
  } catch {
    // Ignorujemy ograniczenia przeglądarki.
  }
}
