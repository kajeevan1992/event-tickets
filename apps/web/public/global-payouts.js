(function(){
  const API = '/api/global-payouts';

  function money(minor){
    return '£' + (Number(minor || 0) / 100).toFixed(2);
  }

  async function getJson(path){
    const res = await fetch(path);
    if(!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function postJson(path, body){
    const res = await fetch(path, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(body || {})
    });
    if(!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function renderGlobalPayouts(){
    if(location.pathname !== '/admin/global-payouts') return;
    const root = document.getElementById('root');
    if(!root) return;

    root.innerHTML = '<main class="dashboard-page"><section class="checkout-card"><h1>Global Payouts</h1><p>Loading...</p></section></main>';

    try{
      const [summary, countries, organisers, requests] = await Promise.all([
        getJson(API + '/summary'),
        getJson(API + '/countries'),
        getJson(API + '/organisers'),
        getJson(API + '/manual-requests')
      ]);

      root.innerHTML = `
        <main class="dashboard-page">
          <section class="checkout-card">
            <h1>Global Payouts</h1>
            <p>Country-based organiser payouts. Stripe Connect is used where supported; manual payouts are queued for countries Stripe does not support.</p>
            <div class="stats eb-stats four">
              <div><b>${summary.summary.organisers || 0}</b><span>Organisers</span></div>
              <div><b>${summary.summary.stripeConnectOrganisers || 0}</b><span>Stripe Connect</span></div>
              <div><b>${summary.summary.manualOrganisers || 0}</b><span>Manual payout</span></div>
              <div><b>${money(summary.summary.balanceMinor)}</b><span>Pending balance</span></div>
            </div>
          </section>

          <section class="checkout-card">
            <h2>Add organiser payout profile</h2>
            <form id="lv-global-org-form" style="display:grid;gap:12px;max-width:640px">
              <input name="name" placeholder="Organiser / company name" required />
              <input name="email" placeholder="Email" />
              <select name="country" required>
                ${countries.items.map(c=>`<option value="${c.code}">${c.code} · ${c.currency} · ${c.stripeSupported ? 'Stripe Connect' : 'Manual payout'}</option>`).join('')}
              </select>
              <input name="accountName" placeholder="Manual payout account name (if not Stripe country)" />
              <input name="bankName" placeholder="Bank / Wise / Payoneer / PayPal details" />
              <textarea name="payoutInstructions" placeholder="Manual payout notes for unsupported Stripe countries"></textarea>
              <button>Create payout profile</button>
            </form>
          </section>

          <section class="checkout-card">
            <h2>Organisers</h2>
            ${(organisers.items || []).length ? organisers.items.map(o=>`
              <article class="clean-row">
                <b>${o.name}</b>
                <span>${o.country} · ${o.currency} · ${o.payoutMethod} · ${o.payoutStatus}</span>
                <span>Balance ${money(o.balanceMinor)} · Paid ${money(o.paidMinor)}</span>
                <button data-request-payout="${o.id}">Request payout</button>
              </article>
            `).join('') : '<p>No organisers yet.</p>'}
          </section>

          <section class="checkout-card">
            <h2>Manual payout queue</h2>
            ${(requests.items || []).length ? requests.items.map(r=>`
              <article class="clean-row">
                <b>${r.organiserName}</b>
                <span>${r.country} · ${r.currency} · ${money(r.amountMinor)} · ${r.status}</span>
                ${r.status !== 'paid' ? `<button data-mark-paid="${r.id}">Mark paid</button>` : ''}
              </article>
            `).join('') : '<p>No manual payout requests yet.</p>'}
          </section>
        </main>`;

      const form = document.getElementById('lv-global-org-form');
      form && form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const body = Object.fromEntries(new FormData(form).entries());
        const created = await postJson(API + '/organisers', body);
        if(created.onboardingUrl){ location.href = created.onboardingUrl; return; }
        location.reload();
      });

      document.querySelectorAll('[data-request-payout]').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
          await postJson(`${API}/organisers/${btn.dataset.requestPayout}/request-payout`, {});
          location.reload();
        });
      });

      document.querySelectorAll('[data-mark-paid]').forEach(btn=>{
        btn.addEventListener('click', async ()=>{
          await postJson(`${API}/manual-requests/${btn.dataset.markPaid}/mark-paid`, { reference:'manual-admin-confirmed' });
          location.reload();
        });
      });

    }catch(err){
      root.innerHTML = `<main class="dashboard-page"><section class="checkout-card"><h1>Global Payouts</h1><p>Could not load global payouts.</p><pre>${String(err.message || err)}</pre><p><a href="/admin/dashboard">Back to admin</a></p></section></main>`;
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderGlobalPayouts);
  else renderGlobalPayouts();
})();
