(function () {
  const API = '/api/discovery';

  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  async function json(path) {
    return window.LocalVibeApi.apiJson(API + path);
  }

  function createCard(e) {
    return `
      <a class="lv-event-card" href="${esc(e.url || `/events/${e.id}`)}">
        <div class="lv-event-image-wrap">
          <img src="${esc(e.image)}" alt="${esc(e.title)}" />
          ${e.trending ? '<span class="lv-card-badge">Trending</span>' : ''}
        </div>
        <div class="lv-event-body">
          <p class="lv-card-meta">${esc(e.city)} · ${esc(e.date || '')}</p>
          <h3>${esc(e.title)}</h3>
          <p class="lv-card-venue">${esc(e.venue || e.category || 'Local event')}</p>
          <div class="lv-card-foot">
            <b>${esc(e.price)}</b>
            <span>${esc(e.reason || e.category || 'Recommended')}</span>
          </div>
        </div>
      </a>
    `;
  }

  function setupSearch() {
    const input = document.getElementById('lvSearchInput');
    const box = document.getElementById('lvSuggestions');
    const city = document.getElementById('lvCitySelect');
    if (!input || !box) return;

    input.addEventListener('input', async () => {
      const q = input.value.trim();
      if (!q) {
        box.innerHTML = '';
        box.classList.remove('show');
        return;
      }
      try {
        const res = await json('/suggest?q=' + encodeURIComponent(q));
        box.innerHTML = res.items.map(i => `
          <button type="button" onclick="location.href='${esc(i.url)}'">
            <span>${esc(i.type)}</span>
            <b>${esc(i.label)}</b>
          </button>
        `).join('');
        box.classList.add('show');
      } catch {
        box.innerHTML = '';
        box.classList.remove('show');
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = encodeURIComponent(input.value.trim());
        const c = encodeURIComponent(city?.value || 'London');
        location.href = `/find-events?q=${q}&city=${c}`;
      }
    });
  }

  async function loadSearchPage() {
    if (location.pathname !== '/find-events') return;
    const root = document.getElementById('root');
    if (!root) return;
    const url = new URL(location.href);
    const q = url.searchParams.get('q') || '';
    const city = url.searchParams.get('city') || 'London';
    const category = url.searchParams.get('category') || '';

    try {
      const [data, facets] = await Promise.all([
        json(`/search?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}`),
        json('/facets')
      ]);

      root.innerHTML = `
        <main class="lv-search-page">
          <section class="lv-search-top">
            <span class="lv-eyebrow">Search events</span>
            <h1>${q ? `Results for “${esc(q)}”` : `Events in ${esc(city)}`}</h1>
            <div class="lv-search-panel inline">
              <div class="lv-search-field"><label>Search</label><input id="lvSearchInput" value="${esc(q)}" autocomplete="off" /><div id="lvSuggestions" class="lv-suggestions"></div></div>
              <div class="lv-search-field compact"><label>City</label><select id="lvCitySelect">${facets.cities.map(c => `<option ${c===city?'selected':''}>${esc(c)}</option>`).join('')}</select></div>
              <button onclick="location.href='/find-events?q='+encodeURIComponent(document.getElementById('lvSearchInput').value)+'&city='+encodeURIComponent(document.getElementById('lvCitySelect').value)">Update</button>
            </div>
          </section>
          <section class="lv-search-layout">
            <aside class="lv-filter-panel">
              <h3>Filters</h3>
              <button onclick="location.href='/find-events?city=London'">London</button>
              <button onclick="location.href='/find-events?city=Birmingham'">Birmingham</button>
              <button onclick="location.href='/find-events?free=true'">Free events</button>
              <hr />
              ${facets.categories.map(c => `<a href="/find-events?category=${encodeURIComponent(c)}">${esc(c)}</a>`).join('')}
            </aside>
            <div>
              <p class="lv-result-count">${data.count} events found</p>
              <div id="results" class="lv-card-grid">${data.items.map(createCard).join('')}</div>
            </div>
          </section>
        </main>
      `;
      setupSearch();
    } catch (err) {
      root.innerHTML = `<main class="lv-search-page"><h1>Search unavailable</h1><p>${esc(err.message)}</p></main>`;
    }
  }

  loadSearchPage();
})();
