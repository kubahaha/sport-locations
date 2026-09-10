export function createLeagueList(leagueData, selectedLeagueId, onSelect, onWarningClick) {
  const list = document.getElementById('league-list');
  if (!list) return;

  list.innerHTML = '';

  leagueData.forEach((league) => {
    const item = document.createElement('li');
    item.className = 'league-item';

    const row = document.createElement('div');
    row.className = 'league-row';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'league-button';
    if (league.id === selectedLeagueId) {
      button.classList.add('is-selected');
    }

    const count = league.resultCount ?? 0;
    const warning = count < league.participants;

    button.innerHTML = `
      <span class="league-name">${league.name}</span>
      <span class="league-meta">
        <span class="league-count">${count} / ${league.participants}</span>
      </span>
    `;

    button.setAttribute('aria-pressed', String(league.id === selectedLeagueId));
    button.addEventListener('click', () => onSelect(league.id));

    row.appendChild(button);

    if (warning) {
      const warningButton = document.createElement('button');
      warningButton.type = 'button';
      warningButton.className = 'league-warning-button';
      warningButton.setAttribute('aria-label', `Pokaż zapytanie Wikidata dla ligi ${league.name}`);
      warningButton.title = `Pokaż zapytanie Wikidata dla ligi ${league.name}`;
      warningButton.textContent = '⚠️';
      warningButton.addEventListener('click', (event) => {
        event.stopPropagation();
        onWarningClick?.(league);
      });
      row.appendChild(warningButton);
    }

    item.appendChild(row);
    list.appendChild(item);
  });
}

export function setStatusMessage(message, isError = false) {
  const node = document.getElementById('status-message');
  if (!node) return;

  node.textContent = message || '';
  node.classList.toggle('is-visible', Boolean(message));
  node.classList.toggle('is-error', Boolean(isError));
}

export function renderSearchResults(results, onSelect) {
  const container = document.getElementById('search-results');
  if (!container) return;

  container.innerHTML = '';

  if (!Array.isArray(results) || results.length === 0) {
    container.classList.remove('is-visible');
    return;
  }

  results.forEach((result) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'search-result-item';
    button.innerHTML = `
      <span class="search-result-title">${result.label || result.id}</span>
      <span class="search-result-meta">${result.description || result.id}</span>
    `;
    button.addEventListener('click', () => onSelect(result));
    container.appendChild(button);
  });

  container.classList.add('is-visible');
}

export function toggleSidebar(open) {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('menu-toggle');

  if (!sidebar || !toggle) return;

  sidebar.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? '☰' : '☰';
  toggle.setAttribute('aria-label', open ? 'Otwórz menu' : 'Zamknij menu');
}
