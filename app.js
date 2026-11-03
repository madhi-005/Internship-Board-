(() => {
  'use strict';

  const DATA_URL = 'data/internships.json';

  const els = {
    form: document.getElementById('filter-form'),
    search: document.getElementById('search'),
    mode: document.getElementById('mode'),
    chips: document.getElementById('domain-chips'),
    list: document.getElementById('card-list'),
    status: document.getElementById('status'),
    empty: document.getElementById('empty-state'),
    error: document.getElementById('error-state'),
    errorMsg: document.getElementById('error-message'),
    retry: document.getElementById('retry'),
    emptyReset: document.getElementById('empty-reset'),
  };

  const state = { all: [], query: '', mode: '', domain: '', loaded: false, applied: loadApplied() };

  // Applications are remembered in this browser (localStorage), wrapped in try/catch in case it's blocked.
  function loadApplied() {
    try {
      return new Set(JSON.parse(localStorage.getItem('applied-internships') || '[]'));
    } catch (_) { return new Set(); }
  }
  function saveApplied() {
    try { localStorage.setItem('applied-internships', JSON.stringify([...state.applied])); } catch (_) { /* ignore */ }
  }

  // ---------- Data ----------
  async function loadData() {
    els.status.textContent = 'Loading internships…';
    els.error.hidden = true;
    try {
      let json;
      if (location.protocol === 'file:' && window.INTERNSHIP_FALLBACK) {
        // Opened straight from disk: fetch() is blocked by the browser, so use the bundled copy.
        json = window.INTERNSHIP_FALLBACK;
      } else {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        json = await res.json();
      }
      if (!json || !Array.isArray(json.internships)) throw new Error('Data format is not valid.');
      state.all = json.internships;
      state.loaded = true;
      buildFilters();
      render();
    } catch (err) {
      state.loaded = false;
      showError(err);
    }
  }

  function showError(err) {
    els.list.innerHTML = '';
    els.empty.hidden = true;
    els.error.hidden = false;
    els.errorMsg.textContent =
      'Please check your connection (or run the page through a local server) and try again. Details: ' +
      (err && err.message ? err.message : 'unknown error');
    els.status.textContent = 'Failed to load listings.';
    els.retry.focus();
  }

  // ---------- Filters ----------
  function unique(key) {
    return [...new Set(state.all.map(i => i[key]))].sort();
  }

  function buildFilters() {
    els.mode.innerHTML = '<option value="">All modes</option>' +
      unique('mode').map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');

    els.chips.innerHTML = '';
    ['All domains', ...unique('domain')].forEach((name, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = name;
      b.dataset.value = idx === 0 ? '' : name;
      b.setAttribute('aria-pressed', idx === 0 ? 'true' : 'false');
      els.chips.appendChild(b);
    });
  }

  function setDomain(value) {
    state.domain = value;
    els.chips.querySelectorAll('.chip').forEach(c =>
      c.setAttribute('aria-pressed', String(c.dataset.value === value)));
    render();
  }

  function getFiltered() {
    const q = state.query.trim().toLowerCase();
    return state.all.filter(i => {
      if (state.mode && i.mode !== state.mode) return false;
      if (state.domain && i.domain !== state.domain) return false;
      if (!q) return true;
      const hay = [i.title, i.domain, i.location, i.mode, ...i.skills].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  // ---------- Render ----------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // A stable colour per domain, so each domain gets its own accent.
  function hueFor(text) {
    let h = 0;
    for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }
  function initials(title) {
    return title.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  function cardHtml(i) {
    const applied = state.applied.has(i.id);
    const open = i.openings === 1 ? '1 opening' : `${i.openings} openings`;
    return `
      <li>
        <article class="card${applied ? ' card--applied' : ''}" data-id="${escapeHtml(i.id)}" style="--hue:${hueFor(i.domain)}" aria-labelledby="t-${escapeHtml(i.id)}">
          <div class="card-head">
            <span class="avatar" aria-hidden="true">${escapeHtml(initials(i.title))}</span>
            <p class="domain">${escapeHtml(i.domain)}</p>
          </div>
          <h3 id="t-${escapeHtml(i.id)}">${escapeHtml(i.title)}</h3>
          <ul class="meta" aria-label="Details">
            <li class="badge badge--mode">${escapeHtml(i.mode)}</li>
            <li class="badge">${escapeHtml(i.location)}</li>
          </ul>
          <ul class="skills" aria-label="Skills needed">
            ${i.skills.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
          </ul>
          <div class="card-footer">
            <span>${open}</span>
            <div class="card-actions">
              <button type="button" class="btn btn--ghost" data-details="${escapeHtml(i.id)}" aria-label="View details for ${escapeHtml(i.title)}">Details</button>
              <button type="button" class="btn ${applied ? 'btn--applied' : ''}" data-apply="${escapeHtml(i.id)}" aria-pressed="${applied}"
                aria-label="${applied ? 'Applied to' : 'Apply for'} ${escapeHtml(i.title)}${applied ? '. Press to withdraw' : ''}">${applied ? 'Applied ✓' : 'Apply'}</button>
            </div>
          </div>
        </article>
      </li>`;
  }

  function render() {
    // If data never loaded, keep the error state visible instead of a misleading "no results".
    if (!state.loaded) return;
    const items = getFiltered();
    els.error.hidden = true;
    els.list.innerHTML = items.map(cardHtml).join('');
    els.empty.hidden = items.length > 0;
    els.status.textContent = items.length === 0
      ? 'No internships found.'
      : `Showing ${items.length} of ${state.all.length} internship${state.all.length === 1 ? '' : 's'}.`;
    if (state.applied.size) els.status.textContent += ` You have applied to ${state.applied.size}.`;
  }

  function toggleApply(id) {
    const item = state.all.find(x => x.id === id);
    if (!item) return;
    const nowApplied = !state.applied.has(id);
    if (nowApplied) state.applied.add(id); else state.applied.delete(id);
    saveApplied();
    render();
    els.status.textContent = nowApplied
      ? `Applied to ${item.title}. Good luck!`
      : `Application for ${item.title} withdrawn.`;
    const again = els.list.querySelector(`[data-apply="${id}"]`);
    if (again) again.focus();
  }

  function resetAll() {
    state.query = ''; state.mode = ''; state.domain = '';
    els.search.value = ''; els.mode.value = '';
    setDomain('');
    els.search.focus();
  }

  // ---------- Events ----------
  els.search.addEventListener('input', e => { state.query = e.target.value; render(); });
  els.mode.addEventListener('change', e => { state.mode = e.target.value; render(); });
  els.form.addEventListener('submit', e => e.preventDefault());
  els.form.addEventListener('reset', e => { e.preventDefault(); resetAll(); });
  els.emptyReset.addEventListener('click', resetAll);
  els.retry.addEventListener('click', loadData);

  els.chips.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (chip) setDomain(chip.dataset.value);
  });

  // Arrow-key navigation between domain chips
  els.chips.addEventListener('keydown', e => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    const chips = [...els.chips.querySelectorAll('.chip')];
    let idx = chips.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();
    if (e.key === 'ArrowRight') idx = (idx + 1) % chips.length;
    if (e.key === 'ArrowLeft') idx = (idx - 1 + chips.length) % chips.length;
    if (e.key === 'Home') idx = 0;
    if (e.key === 'End') idx = chips.length - 1;
    chips[idx].focus();
  });

  // "/" focuses search, Esc clears it
  document.addEventListener('keydown', e => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (e.key === '/' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) {
      e.preventDefault();
      els.search.focus();
    }
  });
  els.search.addEventListener('keydown', e => {
    if (e.key === 'Escape' && els.search.value) {
      e.preventDefault();
      els.search.value = '';
      state.query = '';
      render();
    }
  });

  // ---------- Details dialog ----------
  const dlg = document.getElementById('details-dialog');
  let lastTrigger = null;

  function openDetails(id, trigger) {
    const i = state.all.find(x => x.id === id);
    if (!i) return;
    lastTrigger = trigger;
    document.getElementById('dlg-domain').textContent = i.domain;
    document.getElementById('dlg-title').textContent = i.title;
    document.getElementById('dlg-info').innerHTML =
      `<dt>ID</dt><dd>${escapeHtml(i.id)}</dd>` +
      `<dt>Mode</dt><dd>${escapeHtml(i.mode)}</dd>` +
      `<dt>Location</dt><dd>${escapeHtml(i.location)}</dd>` +
      `<dt>Openings</dt><dd>${i.openings}</dd>`;
    document.getElementById('dlg-skills').innerHTML = i.skills.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    dlg.showModal(); // native modal: traps focus, Esc closes
  }

  els.list.addEventListener('click', e => {
    const apply = e.target.closest('[data-apply]');
    if (apply) { toggleApply(apply.dataset.apply); return; }
    const btn = e.target.closest('[data-details]');
    if (btn) openDetails(btn.dataset.details, btn);
  });
  document.getElementById('dlg-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); // click on backdrop
  dlg.addEventListener('close', () => {
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  });

  loadData();
})();
