export function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) {
    throw new Error('Brak elementu mapy.');
  }

  const map = L.map(mapElement, {
    zoomControl: true,
    attributionControl: true
  }).setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  return map;
}

export function renderMarkers(map, stadiums) {
  if (!map) return;

  if (map._stadiumLayer) {
    map.removeLayer(map._stadiumLayer);
  }

  const layerGroup = L.layerGroup();

  for (const stadium of stadiums) {
    if (!stadium?.coordinates || !Array.isArray(stadium.coordinates) || stadium.coordinates.length !== 2) {
      continue;
    }

    const marker = L.marker(stadium.coordinates);
    marker.bindPopup(buildPopup(stadium));
    marker.addTo(layerGroup);
  }

  map._stadiumLayer = layerGroup;
  layerGroup.addTo(map);
}

export function fitMapToStadiums(map, stadiums) {
  if (!map || !Array.isArray(stadiums) || stadiums.length === 0) {
    return;
  }

  const validPoints = stadiums
    .map((stadium) => stadium?.coordinates)
    .filter((coord) => Array.isArray(coord) && coord.length === 2 && Number.isFinite(coord[0]) && Number.isFinite(coord[1]));

  if (!validPoints.length) {
    return;
  }

  const bounds = L.latLngBounds(validPoints);

  if (validPoints.length === 1) {
    const point = validPoints[0];
    map.setView(point, 11, { animate: true });
    return;
  }

  map.fitBounds(bounds.pad(0.18), {
    animate: true,
    maxZoom: 11,
    padding: [32, 32]
  });
}

export function getVisibleStadiumsForMap(map, stadiums) {
  if (!map || !Array.isArray(stadiums) || stadiums.length === 0) {
    return [];
  }

  const bounds = map.getBounds();
  return stadiums.filter((stadium) => {
    const coord = stadium?.coordinates;
    if (!Array.isArray(coord) || coord.length !== 2) {
      return false;
    }

    const [lat, lng] = coord;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return false;
    }

    return bounds.contains([lat, lng]);
  });
}

export function buildOsmExport(stadiums) {
  const items = Array.isArray(stadiums) ? stadiums.filter((stadium) => Array.isArray(stadium?.coordinates) && stadium.coordinates.length === 2) : [];
  if (!items.length) {
    return '<?xml version="1.0" encoding="UTF-8"?><osm version="0.6" generator="sport-locations-export"></osm>';
  }

  const nodeXml = [];
  const wayXml = [];

  items.forEach((stadium, index) => {
    const [lat, lng] = stadium.coordinates;
    const stadiumName = sanitizeXml(stadium?.stadium || stadium?.club || 'Stadion');
    const clubName = sanitizeXml(stadium?.club || '');
    const capacity = Number(stadium?.capacity);
    const wikidata = stadium?.wikidataId || stadium?.wikidata || '';
    const offsetLat = 0.0003;
    const offsetLng = 0.0003;

    const startId = -(index * 2 + 1);
    const endId = -(index * 2 + 2);
    const startPoint = [lat - offsetLat, lng - offsetLng];
    const endPoint = [lat + offsetLat, lng + offsetLng];

    const nodeTags = [
      `<tag k="name" v="${stadiumName}" />`,
      `<tag k="leisure" v="stadium" />`,
      `<tag k="fixme" v="delete" />`
    ];

    if (capacity && Number.isFinite(capacity)) {
      nodeTags.push(`<tag k="capacity" v="${String(capacity)}" />`);
    }

    if (wikidata) {
      nodeTags.push(`<tag k="wikidata" v="${sanitizeXml(wikidata)}" />`);
    }

    if (clubName) {
      nodeTags.push(`<tag k="club" v="${clubName}" />`);
    }

    nodeXml.push(`  <node id="${startId}" lat="${Number(startPoint[0]).toFixed(7)}" lon="${Number(startPoint[1]).toFixed(7)}" version="1">\n    ${nodeTags.join('\n    ')}\n  </node>`);
    nodeXml.push(`  <node id="${endId}" lat="${Number(endPoint[0]).toFixed(7)}" lon="${Number(endPoint[1]).toFixed(7)}" version="1">\n    ${nodeTags.join('\n    ')}\n  </node>`);

    const wayTags = [
      `<tag k="name" v="${stadiumName}" />`,
      `<tag k="leisure" v="stadium" />`,
      `<tag k="line" v="short" />`,
      `<tag k="fixme" v="delete" />`
    ];

    if (capacity && Number.isFinite(capacity)) {
      wayTags.push(`<tag k="capacity" v="${String(capacity)}" />`);
    }

    if (wikidata) {
      wayTags.push(`<tag k="wikidata" v="${sanitizeXml(wikidata)}" />`);
    }

    if (clubName) {
      wayTags.push(`<tag k="club" v="${clubName}" />`);
    }

    wayXml.push(`  <way id="-${index + 1}" version="1">\n    <nd ref="${startId}" />\n    <nd ref="${endId}" />\n    ${wayTags.join('\n    ')}\n  </way>`);
  });

  const bounds = items
    .map((stadium) => stadium.coordinates)
    .reduce((acc, [lat, lng]) => {
      acc.minLat = Math.min(acc.minLat, lat);
      acc.maxLat = Math.max(acc.maxLat, lat);
      acc.minLon = Math.min(acc.minLon, lng);
      acc.maxLon = Math.max(acc.maxLon, lng);
      return acc;
    }, { minLat: Number.POSITIVE_INFINITY, maxLat: Number.NEGATIVE_INFINITY, minLon: Number.POSITIVE_INFINITY, maxLon: Number.NEGATIVE_INFINITY });

  return `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="sport-locations-export">
  <bounds minlat="${Number(bounds.minLat).toFixed(7)}" minlon="${Number(bounds.minLon).toFixed(7)}" maxlat="${Number(bounds.maxLat).toFixed(7)}" maxlon="${Number(bounds.maxLon).toFixed(7)}" />
${nodeXml.join('\n')}
${wayXml.join('\n')}
</osm>`;
}

export function buildOverpassTurboUrl(stadiums) {
  const points = Array.isArray(stadiums)
    ? stadiums.filter((stadium) => Array.isArray(stadium?.coordinates) && stadium.coordinates.length === 2)
    : [];

  if (!points.length) {
    return '';
  }

  const queries = points.slice(0, 25).map((stadium) => {
    const [lat, lng] = stadium.coordinates;
    return `(
      nwr[leisure=stadium](around:250,${Number(lat).toFixed(6)},${Number(lng).toFixed(6)});
    );`;
  }).join('\n');

  const query = `[out:json][timeout:25];\n(\n${queries}\n);\nout center tags;`;
  return `https://overpass-turbo.eu/?Q=${encodeURIComponent(query)}`;
}

function buildPopup(stadium) {
  const stadiumName = stadium?.stadium || 'Nieznany stadion';
  const clubName = stadium?.club || 'Nieznany klub';
  const capacity = formatCapacity(stadium?.capacity);
  const league = stadium?.leagueName;

  const content = `
    <div>
      <h3>${escapeHtml(stadiumName)}</h3>
      ${league ? `<div class="popup-row"><strong>Liga:</strong> ${escapeHtml(league)}</div>` : ''}
      <div class="popup-row"><strong>Klub:</strong> ${escapeHtml(clubName)}</div>
      ${capacity ? `<div class="popup-row"><strong>Pojemność:</strong> ${escapeHtml(capacity)}</div>` : ''}
    </div>
  `;

  return content;
}

function formatCapacity(value) {
  if (value === null || value === undefined || value === '') return '';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '';
  return new Intl.NumberFormat('pl-PL').format(numeric);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
