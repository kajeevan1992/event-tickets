(function(){
  const API = '/api/seo';

  function escapeHtml(value){
    return String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch] || ch));
  }

  function setMeta(name, content, property=false){
    if(!content) return;
    const attr = property ? 'property' : 'name';
    let tag = document.querySelector(`meta[${attr}="${name}"]`);
    if(!tag){
      tag = document.createElement('meta');
      tag.setAttribute(attr, name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  }

  function setCanonical(url){
    if(!url) return;
    let link = document.querySelector('link[rel="canonical"]');
    if(!link){
      link = document.createElement('link');
      link.setAttribute('rel','canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  function setSchema(schema){
    if(!schema) return;
    let script = document.getElementById('lv-jsonld-schema');
    if(!script){
      script = document.createElement('script');
      script.id = 'lv-jsonld-schema';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);
  }

  function applySeo(data){
    const item = data.item || data;
    document.title = item.seoTitle || item.title || 'LocalVibe';
    setMeta('description', item.seoDescription || item.description || item.content);
    setCanonical(item.canonical);
    if(item.openGraph){
      setMeta('og:title', item.openGraph.title, true);
      setMeta('og:description', item.openGraph.description, true);
      setMeta('og:image', item.openGraph.image, true);
      setMeta('og:url', item.openGraph.url, true);
      setMeta('og:type', item.schema ? 'event' : 'website', true);
    }
    setSchema(item.schema);
  }

  async function getJson(path){
    const res = await fetch(path);
    if(!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function pageShell(content){
    return `
      <main class="seo-page">
        ${content}
      </main>
    `;
  }

  function eventCard(e){
    return `
      <a class="event-card seo-event-card" href="/events/${escapeHtml(e.id || e.slug)}">
        <img src="${escapeHtml(e.image)}" alt="${escapeHtml(e.title)}" />
        <div class="card-body">
          <span class="tag">${escapeHtml(e.category || 'Event')}</span>
          <h3>${escapeHtml(e.title)}</h3>
          <p>${escapeHtml(e.city || '')} · ${escapeHtml(e.date || '')}</p>
          <p>${escapeHtml(e.price || '')}</p>
        </div>
      </a>
    `;
  }

  async function renderLandingPage(slug){
    const root = document.getElementById('root');
    if(!root) return;
    root.innerHTML = pageShell('<section class="seo-hero"><h1>Loading...</h1></section>');

    const [page, events] = await Promise.all([
      getJson(`${API}/landing-pages/${encodeURIComponent(slug)}`),
      getJson('/api/discovery/search')
    ]);

    const item = page.item;
    applySeo(page);
    const related = (events.items || []).filter(e => {
      const hay = [e.title,e.city,e.category,e.tags].join(' ').toLowerCase();
      return hay.includes(String(item.city || '').toLowerCase()) || hay.includes(String(item.category || '').toLowerCase());
    }).slice(0,8);

    root.innerHTML = pageShell(`
      <section class="seo-hero" style="background-image:linear-gradient(90deg,rgba(20,10,35,.78),rgba(20,10,35,.26)),url('${escapeHtml(item.hero)}')">
        <div>
          <span class="eyebrow">LocalVibe guide</span>
          <h1>${escapeHtml(item.title)}</h1>
          <p>${escapeHtml(item.seoDescription)}</p>
          <form class="seo-search" onsubmit="event.preventDefault(); location.href='/find-events?q='+encodeURIComponent(this.q.value)+'&city=${encodeURIComponent(item.city || '')}'">
            <input name="q" placeholder="Search ${escapeHtml(item.city || 'events')}" />
            <button>Search events</button>
          </form>
        </div>
      </section>

      <section class="seo-content">
        <article>
          <h2>Discover ${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.content)}</p>
          <div class="seo-keywords">
            ${(item.keywords || []).map(k=>`<a href="/find-events?q=${encodeURIComponent(k)}">${escapeHtml(k)}</a>`).join('')}
          </div>
        </article>
      </section>

      <section class="seo-events">
        <h2>Popular events</h2>
        <div class="grid">${related.map(eventCard).join('') || '<p>No related events yet.</p>'}</div>
      </section>
    `);
  }

  async function renderPublicEvent(slugOrId){
    const root = document.getElementById('root');
    if(!root) return;
    root.innerHTML = pageShell('<section class="seo-hero"><h1>Loading event...</h1></section>');

    const data = await getJson(`${API}/public-events/${encodeURIComponent(slugOrId)}`);
    const e = data.item;
    applySeo(data);

    root.innerHTML = pageShell(`
      <section class="public-event-hero">
        <img src="${escapeHtml(e.image)}" alt="${escapeHtml(e.title)}" />
        <div>
          <span class="eyebrow">${escapeHtml(e.category)}</span>
          <h1>${escapeHtml(e.title)}</h1>
          <p>${escapeHtml(e.description)}</p>
          <div class="public-event-meta">
            <span>${escapeHtml(e.date)} · ${escapeHtml(e.time)}</span>
            <span>${escapeHtml(e.venue)}, ${escapeHtml(e.city)}</span>
            <span>${escapeHtml(e.price)}</span>
          </div>
          <a class="primary-full" href="/checkout/${escapeHtml(e.id)}">Get tickets</a>
        </div>
      </section>

      <section class="seo-content two-col-lite">
        <article>
          <h2>About this event</h2>
          <p>${escapeHtml(e.description)}</p>
          <h2>Organiser</h2>
          <p>${escapeHtml(e.organiser)}</p>
        </article>
        <aside>
          <h3>Share this event</h3>
          <a href="https://wa.me/?text=${encodeURIComponent(e.title + ' ' + location.href)}">Share on WhatsApp</a>
          <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(e.title)}&url=${encodeURIComponent(location.href)}">Share on X</a>
          <a href="/find-events?city=${encodeURIComponent(e.city)}">More events in ${escapeHtml(e.city)}</a>
        </aside>
      </section>
    `);
  }

  async function init(){
    try{
      const path = location.pathname;
      const lp = path.match(/^\/lp\/([^/]+)/);
      const event = path.match(/^\/events\/([^/]+)/);
      if(lp){ await renderLandingPage(lp[1]); return; }
      if(event && !/^\d+$/.test(event[1])){ await renderPublicEvent(event[1]); return; }
    }catch(err){
      const root = document.getElementById('root');
      if(root) root.innerHTML = pageShell(`<section class="checkout-card"><h1>Page not found</h1><p>${escapeHtml(err.message)}</p><a href="/find-events">Find events</a></section>`);
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
