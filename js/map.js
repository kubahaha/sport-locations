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

function buildPopup(stadium) {
  const stadiumName = stadium?.stadium || 'Nieznany stadion';
  const clubName = stadium?.club || 'Nieznany klub';
  const capacity = formatCapacity(stadium?.capacity);

  const content = `
    <div>
      <h3>${escapeHtml(stadiumName)}</h3>
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
