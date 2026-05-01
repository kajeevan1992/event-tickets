(function () {
  const API = '/api/discovery';

  function createCard(e) {
    return `
      <div class="event-card">
        <img src="${e.image}" />
        <div class="card-body">
          <h3>${e.title}</h3>
          <p>${e.city} · ${e.date}</p>
          <p>${e.price}</p>
        </div>
      </div>
    `;
  }

  async function loadHome() {
    if (location.pathname !== '/') return;

    const root = document.getElementById('root');

    const trending = await fetch(API + '/trending').then(r => r.json());
    const recommended = await fetch(API + '/recommendations?city=London').then(r => r.json());

    root.innerHTML = `
      <div class="home">
        <div class="search-box">
          <input id="searchInput" placeholder="Search events..." />
          <div id="suggestions"></div>
        </div>

        <h2>Trending</h2>
        <div class="grid">
          ${trending.items.map(createCard).join('')}
        </div>

        <h2>Recommended for you</h2>
        <div class="grid">
          ${recommended.items.map(createCard).join('')}
        </div>
      </div>
    `;

    setupSearch();
  }

  function setupSearch() {
    const input = document.getElementById('searchInput');
    const box = document.getElementById('suggestions');

    input.addEventListener('input', async () => {
      const q = input.value;
      if (!q) return (box.innerHTML = '');

      const res = await fetch(API + '/suggest?q=' + q).then(r => r.json());

      box.innerHTML = res.items.map(i =>
        `<div onclick="location.href='${i.url}'">${i.label}</div>`
      ).join('');
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        location.href = '/find-events?q=' + input.value;
      }
    });
  }

  async function loadSearchPage() {
    if (location.pathname !== '/find-events') return;

    const root = document.getElementById('root');
    const url = new URL(location.href);
    const q = url.searchParams.get('q') || '';

    const data = await fetch(API + '/search?q=' + q).then(r => r.json());

    root.innerHTML = `
      <div class="search-page">
        <h1>Results for "${q}"</h1>

        <div class="filters">
          <button onclick="filterCity('London')">London</button>
          <button onclick="filterCity('Birmingham')">Birmingham</button>
          <button onclick="filterFree()">Free</button>
        </div>

        <div id="results" class="grid">
          ${data.items.map(createCard).join('')}
        </div>
      </div>
    `;

    window.filterCity = async (city) => {
      const res = await fetch(API + '/search?city=' + city).then(r => r.json());
      document.getElementById('results').innerHTML =
        res.items.map(createCard).join('');
    };

    window.filterFree = async () => {
      const res = await fetch(API + '/search?free=true').then(r => r.json());
      document.getElementById('results').innerHTML =
        res.items.map(createCard).join('');
    };
  }

  function init() {
    loadHome();
    loadSearchPage();
  }

  init();
})();