export function createLeagueList(leagueData, selectedLeagueId, onSelect) {
  const list = document.getElementById('league-list');
  if (!list) return;

  list.innerHTML = '';

  leagueData.forEach((league) => {
    const item = document.createElement('li');
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
        ${warning ? '<span class="league-warning">⚠️</span>' : ''}
      </span>
    `;

    button.setAttribute('aria-pressed', String(league.id === selectedLeagueId));
    button.addEventListener('click', () => onSelect(league.id));
    item.appendChild(button);
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

export function toggleSidebar(open) {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('menu-toggle');

  if (!sidebar || !toggle) return;

  sidebar.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? '☰' : '✕';
  toggle.setAttribute('aria-label', open ? 'Otwórz menu' : 'Zamknij menu');
}
