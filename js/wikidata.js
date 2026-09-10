import { leagues } from './config.js';

const WIKIDATA_SPARQL_URL = 'https://query.wikidata.org/sparql?format=json&query=';

const leagueMap = new Map(leagues.map((league) => [league.id, league]));

function buildLeagueQuery(league) {
  const query = `
    SELECT ?club ?clubLabel ?stadium ?stadiumLabel ?capacity ?coord WHERE {
      {
        SELECT DISTINCT ?club WHERE {
          wd:${league.wikidataId} wdt:P710 ?club.
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

export function getLeagueById(leagueId) {
  return leagueMap.get(leagueId) ?? null;
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
