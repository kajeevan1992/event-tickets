import React from 'react';

export default function GlobalPayoutsPage() {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    fetch('/api/global-payouts/summary')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return <div style={{padding:20}}>Loading payouts...</div>;

  return (
    <div style={{padding:20}}>
      <h1>Global Payouts</h1>

      <div style={{display:'grid',gap:10,marginTop:20}}>
        <div>Total organisers: {data.summary.organisers}</div>
        <div>Stripe organisers: {data.summary.stripeConnectOrganisers}</div>
        <div>Manual organisers: {data.summary.manualOrganisers}</div>
        <div>Pending balance: {data.summary.balanceMinor}</div>
        <div>Total paid: {data.summary.paidMinor}</div>
      </div>

      <div style={{marginTop:30}}>
        <a href="/admin/organiser-earnings">Go to Earnings Dashboard →</a>
      </div>
    </div>
  );
}
