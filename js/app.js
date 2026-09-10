import { leagues } from './config.js';
import {
  getCachedLeagueData,
  setCachedLeagueData,
  getLastSelectedLeague,
  setLastSelectedLeague,
  getCustomLeagues,
  setCustomLeagues,
  clearLeagueCache
} from './cache.js';
import {
  fetchLeagueStadiums,
  getLeagueById,
  getAllLeagues,
  registerLeague,
  clearCustomLeagues,
  searchLeagueByText,
  fetchLeagueMetadataByQid
} from './wikidata.js';
import { createLeagueList, setStatusMessage, renderSearchResults, toggleSidebar } from './ui.js';
import { initMap, renderMarkers, fitMapToStadiums } from './map.js';

const state = {
  selectedLeagueId: null,
  isLoading: false,
  currentLeagueData: [],
  customSearchTimer: null
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

async function selectLeague(leagueId, { fromHash = false } = {}) {
  const league = getLeagueById(leagueId);
  if (!league) {
    const fallback = leagues[0];
    if (fallback) {
      setHash(fallback.id);
      return;
    }
    setStatusMessage('Brak dostępnych lig.', true);
    return;
  }

  state.selectedLeagueId = league.id;
  setLastSelectedLeague(league.id);

  if (!fromHash) {
    setHash(league.id);
  }

  renderLeagueList();
  toggleSidebar(false);

  const cached = getCachedLeagueData(league.id);
  if (cached) {
    applyLeagueData(cached, false);
    return;
  }

  await loadLeagueData(league.id);
}

function renderLeagueList() {
  createLeagueList(getLeagueDisplayData(), state.selectedLeagueId, (leagueId) => {
    selectLeague(leagueId);
  });
}

async function loadLeagueData(leagueId) {
  if (state.isLoading && state.selectedLeagueId === leagueId) {
    return;
  }

  state.isLoading = true;
  setStatusMessage('Pobieranie danych…');

  try {
    const stadiums = await fetchLeagueStadiums(leagueId);

    if (!Array.isArray(stadiums) || stadiums.length === 0) {
      setCachedLeagueData(leagueId, []);
      applyLeagueData([], false);
      setStatusMessage('Brak wyników dla tej ligi.');
      return;
    }

    const validRecords = stadiums.filter((entry) => entry && entry.coordinates && entry.coordinates.length === 2);
    const dataToCache = validRecords.length ? validRecords : [];
    setCachedLeagueData(leagueId, dataToCache);
    applyLeagueData(dataToCache, false);
    setStatusMessage('');
  } catch (error) {
    setCachedLeagueData(leagueId, []);
    applyLeagueData([], false);
    setStatusMessage(error?.message || 'Wystąpił błąd podczas pobierania danych.', true);
  } finally {
    state.isLoading = false;
    renderLeagueList();
  }
}

function applyLeagueData(data, shouldShowStatus = true) {
  state.currentLeagueData = Array.isArray(data) ? data : [];
  renderMarkers(map, state.currentLeagueData);
  fitMapToStadiums(map, state.currentLeagueData);

  if (shouldShowStatus) {
    setStatusMessage('');
  }
}

function setHash(leagueId) {
  const nextHash = leagueId ? `#${leagueId}` : '#';
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

function handleHashChange() {
  const rawHash = window.location.hash.replace(/^#/, '');
  const requestedLeague = getLeagueById(rawHash);

  if (requestedLeague) {
    selectLeague(requestedLeague.id, { fromHash: true });
    return;
  }

  const lastSelected = getLastSelectedLeague();
  const fallback = getLeagueById(lastSelected) || leagues[0];
  if (fallback) {
    setHash(fallback.id);
    selectLeague(fallback.id, { fromHash: true });
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
    const matches = await searchLeagueByText(value);
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
        await selectLeague(league.id);
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

  const matches = await searchLeagueByText(value);
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
  await selectLeague(league.id);
}

function bindUi() {
  const toggleButton = document.getElementById('menu-toggle');
  const customInput = document.getElementById('custom-league-input');
  const customButton = document.getElementById('custom-league-button');
  const clearCacheButton = document.getElementById('clear-cache-button');

  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const status = sidebar?.classList.contains('is-open');
      toggleSidebar(!status);
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
      renderLeagueList();
      setStatusMessage('Pamięć cache została wyczyszczona.');
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
    selectLeague(lastSelected, { fromHash: true });
    return;
  }

  const defaultLeague = leagues[0];
  if (defaultLeague) {
    setHash(defaultLeague.id);
    selectLeague(defaultLeague.id, { fromHash: true });
  }
}

initialize();
