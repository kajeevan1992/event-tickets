(function(){
  const API = '/api/analytics';

  function money(v){ return '£' + (Number(v||0)/100).toFixed(2); }

  async function load(){
    if(location.pathname !== '/admin/analytics') return;
    const root = document.getElementById('root');
    root.innerHTML = '<h1>Loading analytics...</h1>';

    try{
      const data = await fetch(API + '/overview').then(r=>r.json());

      root.innerHTML = `
        <main class="dashboard-page">
          <h1>Analytics Dashboard</h1>

          <section class="checkout-card">
            <h2>Overview</h2>
            <p>Revenue: ${data.summary.gross}</p>
            <p>Organiser Revenue: ${data.summary.organiserRevenue}</p>
            <p>Platform Fees: ${data.summary.platformFees}</p>
            <p>Conversion Rate: ${data.summary.conversionRate}%</p>
            <p>Check-in Rate: ${data.summary.checkinRate}%</p>
          </section>

          <section class="checkout-card">
            <h2>Events Performance</h2>
            ${data.events.map(e=>`
              <div class="clean-row">
                <b>${e.event}</b>
                <span>${e.ticketsSold} tickets · ${e.gross}</span>
                <span>Conv: ${e.conversionRate}% · Check-in: ${e.checkinRate}%</span>
              </div>
            `).join('')}
          </section>

          <section class="checkout-card">
            <h2>Traffic Sources</h2>
            ${data.trafficSources.map(s=>`
              <div class="clean-row">
                <b>${s.source}</b>
                <span>${s.views} views → ${s.orders} sales</span>
              </div>
            `).join('')}
          </section>
        </main>
      `;

    }catch(e){
      root.innerHTML = '<h1>Analytics failed</h1>';
    }
  }

  load();
})();
