/* LocalVibe runtime API resolver.
   Use window.LOCALVIBE_API_URL, localStorage.localvibe_api_base, or same-origin /api fallback. */
(function(){
  function cleanBase(value){
    return String(value || '').trim().replace(/\/$/, '');
  }

  function getBase(){
    return cleanBase(window.LOCALVIBE_API_URL || localStorage.getItem('localvibe_api_base') || '');
  }

  function apiUrl(path){
    const p = String(path || '');
    if(/^https?:\/\//i.test(p)) return p;
    const normal = p.startsWith('/') ? p : '/' + p;
    const base = getBase();
    return base ? base + normal : normal;
  }

  async function apiJson(path, options){
    const res = await fetch(apiUrl(path), options);
    const text = await res.text();
    let data = null;
    try{
      data = text ? JSON.parse(text) : null;
    }catch(err){
      const preview = text.slice(0, 80).replace(/\s+/g, ' ');
      throw new Error('API returned non-JSON response. Check VITE_API_URL / LOCALVIBE_API_URL. Preview: ' + preview);
    }
    if(!res.ok){
      throw new Error(data?.error || data?.message || 'API request failed');
    }
    return data;
  }

  window.LocalVibeApi = { apiUrl, apiJson, getBase };
})();
