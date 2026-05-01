(function(){
  const API = '/api/marketplace';

  async function load(){
    if(location.pathname !== '/admin/organiser-earnings') return;

    const root = document.getElementById('root');
    root.innerHTML = '<h1>Loading earnings...</h1>';

    try{
      const summary = await fetch(API + '/summary').then(r=>r.json());
      const ledger = await fetch(API + '/ledger').then(r=>r.json());
      const organisers = await fetch(API + '/organisers').then(r=>r.json());

      root.innerHTML = `
        <main class="dashboard-page">
          <h1>Organiser Earnings</h1>

          <section class="checkout-card">
            <h2>Summary</h2>
            <p>Total Revenue: ${summary.summary.gross}</p>
            <p>Organiser Earnings: ${summary.summary.organiser}</p>
            <p>Platform Fees: ${summary.summary.platform}</p>
            <p>Pending Payouts: ${summary.summary.pending}</p>
            <p>Paid Out: ${summary.summary.paid}</p>
          </section>

          <section class="checkout-card">
            <h2>Organisers</h2>
            ${organisers.items.map(o=>`
              <div class="clean-row">
                <b>${o.name}</b>
                <span>${o.pending} pending · ${o.paid} paid</span>
              </div>
            `).join('')}
          </section>

          <section class="checkout-card">
            <h2>Payout Ledger</h2>
            ${ledger.items.map(l=>`
              <div class="clean-row">
                <b>${l.organiserName}</b>
                <span>${l.organiser} (${l.transferStatus})</span>
                ${l.transferStatus !== 'paid' ? `<button onclick="pay('${l.id}')">Pay</button>`:''}
              </div>
            `).join('')}
          </section>
        </main>
      `;

      window.pay = async (id)=>{
        await fetch(API + '/transfer/' + id, {method:'POST'});
        location.reload();
      };

    }catch(e){
      root.innerHTML = '<h1>Error loading earnings</h1>';
    }
  }

  load();
})();
