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
          <p class="lv-card-meta">${esc(e.city)} · ${esc(e.date)}</p>
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

  async function loadHome() {
    if (location.pathname !== '/') return;
    const root = document.getElementById('root');
    if (!root) return;

    try {
      const [trending, recommended, facets] = await Promise.all([
        json('/trending'),
        json('/recommendations?city=London'),
        json('/facets')
      ]);

      root.innerHTML = `<main><h1>Discovery Loaded</h1></main>`;
    } catch (err) {
      console.error(err);
    }
  }

  loadHome();
})();
