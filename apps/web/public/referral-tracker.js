/* LocalVibe v74 referral frontend integration.
   Safe drop-in script: captures referral codes, injects them into checkout/payment requests,
   records conversions after success, and provides a lightweight /admin/referrals view. */
(function(){
  const STORAGE_KEY = 'localvibe_referral_code';
  const API_BASE_KEY = 'localvibe_api_base';

  function normaliseCode(value){
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');
  }

  function getReferralCode(){
    return normaliseCode(localStorage.getItem(STORAGE_KEY));
  }

  function setReferralCode(code){
    const clean = normaliseCode(code);
    if(clean) localStorage.setItem(STORAGE_KEY, clean);
    return clean;
  }

  function captureFromUrl(){
    const url = new URL(window.location.href);
    const refFromQuery = url.searchParams.get('ref') || url.searchParams.get('referral') || url.searchParams.get('affiliate');
    const match = window.location.pathname.match(/^\/ref\/([^/]+)/);
    const code = setReferralCode(refFromQuery || (match && match[1]));

    if(match && code){
      window.history.replaceState({}, '', `/find-events?ref=${encodeURIComponent(code)}`);
    }
  }

  function rememberApiBase(input){
    try{
      const url = new URL(typeof input === 'string' ? input : input.url, window.location.origin);
      if(url.origin !== window.location.origin){
        localStorage.setItem(API_BASE_KEY, url.origin);
      }
    }catch{}
  }

  function buildApiUrl(path){
    const base = (localStorage.getItem(API_BASE_KEY) || '').replace(/\/$/, '');
    return base ? `${base}${path}` : path;
  }

  function addReferralToBody(init){
    const code = getReferralCode();
    if(!code || !init || !init.body) return init;
    try{
      const body = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
      if(body && typeof body === 'object' && !body.referralCode){
        return { ...init, body: JSON.stringify({ ...body, referralCode: code }) };
      }
    }catch{}
    return init;
  }

  function patchFetch(){
    if(window.__localvibeReferralFetchPatched) return;
    window.__localvibeReferralFetchPatched = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = function(input, init){
      rememberApiBase(input);
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const shouldAttach = /\/api\/(checkout\/start|payments\/create-intent|payments\/intent|orders)/.test(url);
      const patchedInit = shouldAttach ? addReferralToBody(init || {}) : init;
      return originalFetch(input, patchedInit);
    };
  }

  async function convertReferralOnce(){
    const code = getReferralCode();
    if(!code) return;
    const key = `localvibe_referral_converted_${code}`;
    if(sessionStorage.getItem(key)) return;

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('orderId') || params.get('order') || params.get('order_id');

    try{
      await fetch(buildApiUrl('/api/referrals/convert'), {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ code, orderId })
      });
      sessionStorage.setItem(key, '1');
    }catch(err){
      console.warn('Referral conversion not recorded yet', err);
    }
  }

  async function renderAdminReferrals(){
    if(window.location.pathname !== '/admin/referrals') return;
    const root = document.getElementById('root');
    if(!root) return;

    root.innerHTML = '<main class="dashboard-page"><h1>Referral & Affiliate Engine</h1><p>Loading referrals...</p></main>';
    try{
      const res = await fetch(buildApiUrl('/api/referrals'));
      const data = await res.json();
      const items = data.items || [];
      root.innerHTML = `
        <main class="dashboard-page">
          <section class="checkout-card">
            <h1>Referral & Affiliate Engine</h1>
            <p>Track referral links, clicks, conversions and commission.</p>
            <form id="lv-ref-create" style="display:grid;gap:12px;max-width:520px;margin:20px 0">
              <input name="ownerName" placeholder="Partner / influencer name" />
              <input name="ownerEmail" placeholder="Partner email" />
              <input name="commissionRate" placeholder="Commission %" value="10" />
              <button>Create referral code</button>
            </form>
            <div id="lv-ref-list">
              ${items.length ? items.map(item => `
                <article class="clean-row">
                  <b>${item.code}</b>
                  <span>${item.ownerName || 'Partner'} · ${item.clicks || 0} clicks · ${item.conversions || 0} sales · ${item.commissionRate || 10}% commission</span>
                  <code>/ref/${item.code}</code>
                </article>
              `).join('') : '<p>No referral codes yet.</p>'}
            </div>
            <p><a href="/admin/dashboard">Back to admin dashboard</a></p>
          </section>
        </main>`;

      const form = document.getElementById('lv-ref-create');
      form && form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const body = Object.fromEntries(new FormData(form).entries());
        await fetch(buildApiUrl('/api/referrals/create'), {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(body)
        });
        window.location.reload();
      });
    }catch(err){
      root.innerHTML = '<main class="dashboard-page"><section class="checkout-card"><h1>Referral & Affiliate Engine</h1><p>Referral API is not connected yet. Backend route must be mounted at /api/referrals.</p><p><a href="/admin/dashboard">Back to admin dashboard</a></p></section></main>';
    }
  }

  captureFromUrl();
  patchFetch();

  if(['/success','/ticket'].some(p => window.location.pathname.startsWith(p))){
    setTimeout(convertReferralOnce, 800);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', renderAdminReferrals);
  }else{
    renderAdminReferrals();
  }
})();
