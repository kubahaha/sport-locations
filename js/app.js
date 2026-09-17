import { leagues } from './config.js';
import {
  getCachedLeagueData,
  setCachedLeagueData,
  getLastSelectedLeague,
  setLastSelectedLeague,
  getCustomLeagues,
  setCustomLeagues,
  clearLeagueCache,
  getAutoZoomEnabled,
  setAutoZoomEnabled,
  getFullSearchEnabled,
  setFullSearchEnabled
} from './cache.js';
import {
  fetchLeagueStadiums,
  getLeagueById,
  getAllLeagues,
  registerLeague,
  clearCustomLeagues,
  searchLeagueByText,
  fetchLeagueMetadataByQid,
  getLeagueQueryUrl
} from './wikidata.js';
import { createLeagueList, setStatusMessage, renderSearchResults, toggleSidebar } from './ui.js';
import {
  initMap,
  renderMarkers,
  fitMapToStadiums,
  getVisibleStadiumsForMap,
  buildOsmExport,
  buildOverpassTurboUrl
} from './map.js';

const state = {
  selectedLeagueIds: new Set(),
  currentLeagueData: [],
  customSearchTimer: null,
  loadingPromises: new Map(),
  autoZoom: getAutoZoomEnabled(),
  fullSearch: getFullSearchEnabled()
};

const map = initMap();

function persistCustomLeagues() {
  const customLeagues = getAllLeagues().filter((league) => Boolean(league?.isCustom));
  const customMap = Object.fromEntries(customLeagues.map((league) => [league.id, league]));
  setCustomLeagues(customMap);
}

function restoreCustomLeagues() {
  const saved = getCustomLeagues();
  Object.values(saved).forEach((league) => {
    registerLeague({ ...league, isCustom: true });
  });
}

function getLeagueDisplayData() {
  return getAllLeagues().map((league) => ({
    ...league,
    resultCount: getCachedLeagueData(league.id)?.length ?? 0
  }));
}

async function selectLeague(leagueId, shouldSelect, { fromHash = false } = {}) {
  let league = getLeagueById(leagueId);
  if (!league) {
    return;
  }

  league = await loadLeagueMetadata(league);

  if (shouldSelect) {
    state.selectedLeagueIds.add(league.id);
    setLastSelectedLeague(league.id);
  } else {
    state.selectedLeagueIds.delete(league.id);
  }

  if (!fromHash) {
    setHash([...state.selectedLeagueIds]);
  }

  renderLeagueList();
  if (shouldSelect) {
    await loadLeagueData(league.id);
  }

  renderCombinedLeagueData();
}

async function loadLeagueMetadata(league) {
  if (league.sportLoaded) {
    return league;
  }

  try {
    const metadata = await fetchLeagueMetadataByQid(league.wikidataId);
    return registerLeague({
      ...league,
      sport: metadata.sport,
      sportLoaded: true,
      participants: league.participants || metadata.participants,
      isCustom: Boolean(league.isCustom)
    });
  } catch {
    return league;
  }
}

function openLeagueQueryInNewTab(league) {
  const url = getLeagueQueryUrl(league);
  if (!url) {
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

function renderLeagueList() {
  createLeagueList(
    getLeagueDisplayData(),
    state.selectedLeagueIds,
    (leagueId, shouldSelect) => {
      selectLeague(leagueId, shouldSelect);
    },
    (league) => {
      openLeagueQueryInNewTab(league);
    }
  );
}

async function loadLeagueData(leagueId) {
  const cached = getCachedLeagueData(leagueId);
  if (cached !== null) {
    return cached;
  }

  if (state.loadingPromises.has(leagueId)) {
    return state.loadingPromises.get(leagueId);
  }

  setStatusMessage('Pobieranie danych…');

  const loadingPromise = fetchLeagueStadiums(leagueId)
    .then((stadiums) => {
      if (!Array.isArray(stadiums) || stadiums.length === 0) {
        setCachedLeagueData(leagueId, []);
        return [];
      }

      const validRecords = stadiums.filter((entry) => entry?.coordinates?.length === 2);
      const dataToCache = validRecords.map((entry) => ({
        ...entry,
        leagueName: getLeagueById(leagueId)?.name || leagueId
      }));
      setCachedLeagueData(leagueId, dataToCache);
      return dataToCache;
    })
    .catch((error) => {
      setStatusMessage(error?.message || 'Wystąpił błąd podczas pobierania danych.', true);
      return null;
    })
    .finally(() => {
      state.loadingPromises.delete(leagueId);
      renderLeagueList();
      if (!state.loadingPromises.size) {
        setStatusMessage('');
      }
    });

  state.loadingPromises.set(leagueId, loadingPromise);
  return loadingPromise;
}

function renderCombinedLeagueData() {
  state.currentLeagueData = [...state.selectedLeagueIds].flatMap((leagueId) => {
    const cached = getCachedLeagueData(leagueId);
    return Array.isArray(cached) ? cached : [];
  });
  renderMarkers(map, state.currentLeagueData);
  if (state.autoZoom) {
    fitMapToStadiums(map, state.currentLeagueData);
  }
}

function setHash(leagueIds) {
  const nextHash = leagueIds.length ? `#${leagueIds.join(',')}` : '#';
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

async function handleHashChange() {
  const rawHash = window.location.hash.replace(/^#/, '');
  const requestedIds = rawHash.split(',').filter(Boolean);
  const validIds = requestedIds.filter((leagueId) => getLeagueById(leagueId));

  if (validIds.length) {
    state.selectedLeagueIds = new Set(validIds);
    renderLeagueList();
    await Promise.all(validIds.map((leagueId) => selectLeague(leagueId, true, { fromHash: true })));
    return;
  }

  const lastSelected = getLastSelectedLeague();
  const fallback = getLeagueById(lastSelected) || leagues[0];
  if (fallback) {
    setHash([fallback.id]);
    await selectLeague(fallback.id, true, { fromHash: true });
  }
}

async function handleCustomLeagueSearch() {
  const input = document.getElementById('custom-league-input');
  const value = input?.value.trim();

  if (!value) {
    renderSearchResults([], () => {});
    return;
  }

  try {
    const matches = await searchLeagueByText(value, { fullSearch: state.fullSearch });
    if (!matches.length) {
      renderSearchResults([], () => {});
      setStatusMessage('Nie znaleziono lig dla tego zapytania.', true);
      return;
    }

    renderSearchResults(matches, async (selected) => {
      try {
        const league = await fetchLeagueMetadataByQid(selected.id);
        registerLeague(league);
        persistCustomLeagues();
        input.value = '';
        renderSearchResults([], () => {});
        await selectLeague(league.id, true);
      } catch (error) {
        setStatusMessage(error?.message || 'Nie udało się pobrać danych dla tej ligi.', true);
      }
    });

    setStatusMessage('');
  } catch (error) {
    renderSearchResults([], () => {});
    setStatusMessage(error?.message || 'Nie udało się wyszukać ligi w Wikidata.', true);
  }
}

function scheduleCustomLeagueSearch() {
  const input = document.getElementById('custom-league-input');
  if (!input) return;

  clearTimeout(state.customSearchTimer);

  if (!input.value.trim()) {
    renderSearchResults([], () => {});
    return;
  }

  state.customSearchTimer = setTimeout(async () => {
    await handleCustomLeagueSearch();
  }, 250);
}

async function handleCustomLeagueSubmit() {
  const input = document.getElementById('custom-league-input');
  const value = input?.value.trim();

  if (!value) {
    return;
  }

  const matches = await searchLeagueByText(value, { fullSearch: state.fullSearch });
  if (!matches.length) {
    setStatusMessage('Nie znaleziono lig dla tego zapytania.', true);
    return;
  }

  const selected = matches[0];
  const league = await fetchLeagueMetadataByQid(selected.id);
  registerLeague(league);
  persistCustomLeagues();
  input.value = '';
  renderSearchResults([], () => {});
  await selectLeague(league.id, true);
}

function bindUi() {
  const toggleButton = document.getElementById('menu-toggle');
  const customInput = document.getElementById('custom-league-input');
  const customButton = document.getElementById('custom-league-button');
  const clearCacheButton = document.getElementById('clear-cache-button');
  const settingsToggle = document.getElementById('settings-toggle');
  const settingsPanel = document.getElementById('settings-panel');
  const autoZoomToggle = document.getElementById('auto-zoom-toggle');
  const fullSearchToggle = document.getElementById('full-search-toggle');

  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const status = sidebar?.classList.contains('is-open');
      toggleSidebar(!status);
    });
  }

  if (settingsToggle && settingsPanel) {
    settingsToggle.addEventListener('click', () => {
      const isOpen = settingsPanel.classList.toggle('is-open');
      settingsToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (autoZoomToggle) {
    autoZoomToggle.checked = state.autoZoom;
    autoZoomToggle.addEventListener('change', () => {
      state.autoZoom = autoZoomToggle.checked;
      setAutoZoomEnabled(state.autoZoom);
      if (state.autoZoom) {
        fitMapToStadiums(map, state.currentLeagueData);
      }
    });
  }

  if (fullSearchToggle) {
    fullSearchToggle.checked = state.fullSearch;
    fullSearchToggle.addEventListener('change', async () => {
      state.fullSearch = fullSearchToggle.checked;
      setFullSearchEnabled(state.fullSearch);
      if (customInput?.value.trim()) {
        await handleCustomLeagueSearch();
      }
    });
  }

  if (customButton && customInput) {
    customButton.addEventListener('click', async () => {
      await handleCustomLeagueSubmit();
    });

    customInput.addEventListener('input', () => {
      scheduleCustomLeagueSearch();
    });

    customInput.addEventListener('keydown', async (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        await handleCustomLeagueSubmit();
      }
    });
  }

  if (clearCacheButton) {
    clearCacheButton.addEventListener('click', () => {
      clearLeagueCache();
      clearCustomLeagues();
      state.selectedLeagueIds = new Set();
      state.currentLeagueData = [];
      renderLeagueList();
      renderCombinedLeagueData();
      setStatusMessage('Pamięć cache została wyczyszczona.');
    });
  }

  const downloadButton = document.getElementById('download-osm-button');
  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      const visible = getVisibleStadiumsForMap(map, state.currentLeagueData);
      if (!visible.length) {
        setStatusMessage('Brak widocznych stadionów do pobrania.', true);
        return;
      }

      const xml = buildOsmExport(visible);
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'stadiony-visible.osm';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatusMessage(`Pobrano ${visible.length} widocznych stadionów jako .osm.`);
    });
  }

  const overpassButton = document.getElementById('overpass-query-button');
  if (overpassButton) {
    overpassButton.addEventListener('click', () => {
      const visible = getVisibleStadiumsForMap(map, state.currentLeagueData);
      if (!visible.length) {
        setStatusMessage('Brak widocznych stadionów, do których można utworzyć zapytanie Overpass.', true);
        return;
      }

      const url = buildOverpassTurboUrl(visible);
      if (!url) {
        setStatusMessage('Nie udało się przygotować zapytania Overpass.', true);
        return;
      }

      window.open(url, '_blank', 'noopener,noreferrer');
      setStatusMessage(`Otwieram zapytanie Overpass dla ${visible.length} punktów.`);
    });
  }

  window.addEventListener('hashchange', handleHashChange);

  document.addEventListener('click', (event) => {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('menu-toggle');
    const clickedInsideSidebar = sidebar?.contains(event.target);
    const clickedToggle = toggle?.contains(event.target);

    if (window.innerWidth <= 780 && !clickedInsideSidebar && !clickedToggle && sidebar?.classList.contains('is-open')) {
      toggleSidebar(false);
    }
  });
}

function initialize() {
  restoreCustomLeagues();
  bindUi();
  renderLeagueList();
  toggleSidebar(window.innerWidth > 780);

  const currentHash = window.location.hash.replace(/^#/, '');
  const lastSelected = getLastSelectedLeague();

  if (currentHash) {
    handleHashChange();
    return;
  }

  if (lastSelected && getLeagueById(lastSelected)) {
    setHash([lastSelected]);
    selectLeague(lastSelected, true, { fromHash: true });
    return;
  }

  const defaultLeague = leagues[0];
  if (defaultLeague) {
    setHash([defaultLeague.id]);
    selectLeague(defaultLeague.id, true, { fromHash: true });
  }
}

initialize();
