import { leagues } from './config.js';

const WIKIDATA_SPARQL_URL = 'https://query.wikidata.org/sparql?format=json&query=';

const leagueMap = new Map(leagues.map((league) => [league.id, league]));

export function buildLeagueQuery(league) {
  const query = `
    SELECT ?club ?clubLabel ?stadium ?stadiumLabel ?capacity ?coord WHERE {
      {
        SELECT DISTINCT ?club WHERE {
          wd:${league.wikidataId} wdt:P1923 ?club.
        }
      }

      OPTIONAL {
        ?club wdt:P115 ?stadium.
        OPTIONAL { ?stadium wdt:P1083 ?capacity. }
        OPTIONAL { ?stadium wdt:P625 ?coord. }
      }

      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "pl,en".
      }
    }
    ORDER BY ?clubLabel
  `;

  return query.trim();
}

export function getAllLeagues() {
  return [...leagueMap.values()];
}

export function getLeagueById(leagueId) {
  return leagueMap.get(leagueId) ?? null;
}

export function registerLeague(league) {
  if (!league || !league.id) {
    return null;
  }

  leagueMap.set(league.id, { ...league, isCustom: Boolean(league.isCustom) });
  return leagueMap.get(league.id);
}

export function clearCustomLeagues() {
  const ids = [...leagueMap.keys()].filter((id) => {
    const league = leagueMap.get(id);
    return Boolean(league?.isCustom);
  });

  ids.forEach((id) => leagueMap.delete(id));
}

export async function searchLeagueByText(query) {
  const value = String(query || '').trim();
  if (!value) {
    return [];
  }

  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(value)}&language=pl&format=json&origin=*&type=item&limit=10`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Nie udało się wyszukać ligi w Wikidata.');
  }

  const data = await response.json();

  if (!Array.isArray(data?.search)) {
    return [];
  }

  return data.search
    .filter((item) => item && item.id)
    .map((item) => ({
      id: item.id,
      label: item.label || item.display?.label || item.id,
      description: item.description || item.display?.description || ''
    }));
}

export async function fetchLeagueMetadataByQid(qid) {
  const value = String(qid || '').trim();
  if (!value) {
    throw new Error('Brak identyfikatora ligi.');
  }

  const query = `
    SELECT ?league ?leagueLabel ?participants WHERE {
      VALUES ?league { wd:${value} }
      OPTIONAL { ?league wdt:P1132 ?participants. }
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "pl,en".
      }
    }
  `;

  const url = `${WIKIDATA_SPARQL_URL}${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/sparql-results+json'
    }
  });

  if (!response.ok) {
    throw new Error('Nie udało się pobrać metadanych ligi z Wikidata.');
  }

  const payload = await response.json();
  const bindings = payload?.results?.bindings ?? [];
  const row = bindings[0] ?? {};
  const label = row?.leagueLabel?.value ?? value;
  const participants = Number(row?.participants?.value ?? 0);

  return {
    id: value,
    name: label,
    wikidataId: value,
    participants: Number.isFinite(participants) && participants > 0 ? participants : 0,
    isCustom: true
  };
}

export function getLeagueQueryUrl(league) {
  if (!league?.wikidataId) {
    return '';
  }

  const query = buildLeagueQuery(league);
  return `https://query.wikidata.org/#${encodeURIComponent(query)}`;
}

export async function fetchLeagueStadiums(leagueId) {
  const league = getLeagueById(leagueId);
  if (!league) {
    throw new Error('Nie znaleziono ligi.');
  }

  const query = buildLeagueQuery(league);
  const url = `${WIKIDATA_SPARQL_URL}${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/sparql-results+json'
    }
  });

  if (!response.ok) {
    throw new Error('Nie udało się pobrać danych z Wikidata.');
  }

  const result = await response.json();

  if (!result || !Array.isArray(result.results?.bindings)) {
    throw new Error('Otrzymano nieprawidłową odpowiedź z Wikidata.');
  }

  return parseBindings(result.results.bindings);
}

function parseBindings(bindings) {
  const stadiums = [];

  for (const row of bindings) {
    const club = getValue(row, 'clubLabel');
    const stadium = getValue(row, 'stadiumLabel');
    const capacity = getNumericValue(row, 'capacity');
    const coord = getCoord(row, 'coord');

    if (!stadium && !club && !coord) {
      continue;
    }

    const stadiumRecord = {
      club: club || null,
      stadium: stadium || null,
      capacity: capacity ?? null,
      coordinates: coord,
      raw: row
    };

    if (stadiumRecord.coordinates) {
      stadiums.push(stadiumRecord);
    }
  }

  return stadiums;
}

function getValue(row, key) {
  const value = row?.[key]?.value;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getNumericValue(row, key) {
  const raw = row?.[key]?.value;
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

function getCoord(row, key) {
  const raw = row?.[key]?.value;
  if (!raw || typeof raw !== 'string') {
    return null;
  }

  const match = raw.match(/^Point\(([-+]?\d*\.?\d+)\s([-+]?\d*\.?\d+)\)$/);
  if (!match) {
    return null;
  }

  const lat = Number(match[2]);
  const lng = Number(match[1]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return [lat, lng];
}
