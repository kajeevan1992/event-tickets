(function(){
  const API_MARKET = '/api/marketplace';
  const API_GLOBAL = '/api/global-payouts';

  function getOrderId(){
    const url = new URL(location.href);
    return url.searchParams.get('orderId') || url.searchParams.get('order') || url.searchParams.get('order_id');
  }

  async function tryFetchJson(url){
    try{
      const res = await fetch(url);
      if(!res.ok) return null;
      return res.json();
    }catch{ return null; }
  }

  async function findOrder(orderId){
    if(!orderId) return null;
    const candidates = [
      `/api/orders/${orderId}`,
      `/api/orders/status/${orderId}`,
      `/api/payments/status?orderId=${encodeURIComponent(orderId)}`
    ];
    for(const url of candidates){
      const data = await tryFetchJson(url);
      if(data && (data.order || data.data || data.item)){
        return data.order || data.data || data.item;
      }
    }
    return null;
  }

  async function run(){
    if(!['/success','/ticket'].some(p => location.pathname.startsWith(p))) return;
    const orderId = getOrderId();
    if(!orderId) return;

    const key = `localvibe_v79_done_${orderId}`;
    if(sessionStorage.getItem(key)) return;

    const order = await findOrder(orderId);
    if(!order) return;

    const payload = {
      orderId: order.id || orderId,
      eventId: order.eventId,
      organiserId: order.organiserId,
      organiserName: order.organiserName,
      grossMinor: order.totalMinor || order.amountMinor || 0
    };

    try{
      const splitRes = await fetch(API_MARKET + '/record-split', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
      }).then(r=>r.json());

      await fetch(`${API_GLOBAL}/organisers/${payload.organiserId}/record-earning`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ amountMinor: splitRes.item?.organiserMinor || 0 })
      });

      if(splitRes.item?.stripeAccountId){
        await fetch(`${API_MARKET}/transfer/${splitRes.item.id}`, { method:'POST' });
      }

      sessionStorage.setItem(key, '1');
    }catch(e){
      console.warn('v79 payout automation skipped', e);
    }
  }

  setTimeout(run, 1200);
})();
