import { leagues } from './config.js';
import { getCachedLeagueData, setCachedLeagueData, getLastSelectedLeague, setLastSelectedLeague } from './cache.js';
import { fetchLeagueStadiums, getLeagueById } from './wikidata.js';
import { createLeagueList, setStatusMessage, toggleSidebar } from './ui.js';
import { initMap, renderMarkers, fitMapToStadiums } from './map.js';

const state = {
  selectedLeagueId: null,
  isLoading: false,
  currentLeagueData: []
};

const map = initMap();

function getLeagueDisplayData() {
  return leagues.map((league) => ({
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

function bindUi() {
  const toggleButton = document.getElementById('menu-toggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const status = sidebar?.classList.contains('is-open');
      toggleSidebar(!status);
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
