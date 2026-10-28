// Payments for the coach dashboard's Finance tab: Stripe (invoices, payment links, Stan Store if it pays into your
// Stripe) and Shopify orders. Read-only. Clients are matched by email in the dashboard.
// Setup (Netlify → Site configuration → Environment variables, never paste these anywhere else):
//   STRIPE_KEY       a Stripe *restricted* key with Read access to Charges, Invoices and Customers (starts rk_live_)
//   SHOPIFY_STORE    your store's myshopify address, e.g. colour-me-neurospicy.myshopify.com
//   SHOPIFY_TOKEN    Admin API access token from a custom app with read_orders + read_customers
const { requireAdmin, json } = require('../lib/admin');

const DAYS = 400; // how far back to look
const cents = (n, cur) => (['jpy', 'krw'].includes(String(cur).toLowerCase()) ? n : n / 100);

async function stripeAll(path, key, max) {
  const out = []; let after = '', pages = 0;
  while (pages++ < (max || 6)) {
    const r = await fetch('https://api.stripe.com/v1/' + path + (path.includes('?') ? '&' : '?') + 'limit=100' + (after ? '&starting_after=' + after : ''), { headers: { Authorization: 'Bearer ' + key } });
    if (!r.ok) throw new Error('stripe ' + r.status);
    const d = await r.json(); out.push(...(d.data || []));
    if (!d.has_more || !d.data.length) break; after = d.data[d.data.length - 1].id;
  }
  return out;
}
async function stripe(key) {
  const since = Math.floor(Date.now() / 1000) - DAYS * 86400, items = [];
  const charges = await stripeAll('charges?created[gte]=' + since + '&expand[]=data.customer', key);
  charges.forEach(c => {
    const cu = c.customer && typeof c.customer === 'object' ? c.customer : {};
    const email = (c.billing_details && c.billing_details.email) || c.receipt_email || cu.email || '';
    items.push({ id: c.id, src: 'Stripe', date: new Date(c.created * 1000).toISOString(), amount: cents(c.amount - (c.amount_refunded || 0), c.currency), currency: (c.currency || '').toUpperCase(),
      status: c.refunded ? 'refunded' : c.status === 'succeeded' && c.paid ? 'paid' : c.status === 'failed' ? 'failed' : 'pending',
      email: email.toLowerCase(), name: (c.billing_details && c.billing_details.name) || cu.name || '', desc: (c.description || c.statement_descriptor || '').slice(0, 120), reason: c.failure_message || '' });
  });
  const invoices = await stripeAll('invoices?status=open', key, 3);
  invoices.forEach(i => {
    const due = (i.due_date || i.next_payment_attempt || i.created) * 1000;
    items.push({ id: i.id, src: 'Stripe invoice', date: new Date(due).toISOString(), amount: cents(i.amount_remaining, i.currency), currency: (i.currency || '').toUpperCase(),
      status: due < Date.now() ? 'overdue' : 'open', email: (i.customer_email || '').toLowerCase(), name: i.customer_name || '', desc: ('Invoice ' + (i.number || '')).trim(), link: i.hosted_invoice_url || '' });
  });
  return items;
}
async function shopify(store, token) {
  const since = new Date(Date.now() - DAYS * 864e5).toISOString(), items = [];
  let url = `https://${store.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}/admin/api/2024-10/orders.json?status=any&limit=250&created_at_min=${encodeURIComponent(since)}&fields=id,name,created_at,total_price,current_total_price,currency,financial_status,email,customer,line_items`;
  for (let pages = 0; url && pages < 6; pages++) {
    const r = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    if (!r.ok) throw new Error('shopify ' + r.status);
    const d = await r.json();
    (d.orders || []).forEach(o => {
      const fs = o.financial_status;
      items.push({ id: 'shp_' + o.id, src: 'Shopify', date: o.created_at, amount: Number(o.current_total_price || o.total_price) || 0, currency: o.currency || '',
        status: fs === 'paid' || fs === 'partially_refunded' ? 'paid' : fs === 'refunded' || fs === 'voided' ? 'refunded' : fs === 'pending' || fs === 'authorized' ? 'pending' : fs || 'pending',
        email: String(o.email || (o.customer && o.customer.email) || '').toLowerCase(), name: o.customer ? [o.customer.first_name, o.customer.last_name].filter(Boolean).join(' ') : '',
        desc: (o.name + ' · ' + (o.line_items || []).map(l => l.title).join(', ')).slice(0, 120) });
    });
    const next = /<([^>]+)>;\s*rel="next"/.exec(r.headers.get('link') || ''); url = next ? next[1] : '';
  }
  return items;
}

exports.handler = async (event) => {
  const w = await requireAdmin(event); if (w.error) return w.error;
  const out = { stripe: { connected: !!process.env.STRIPE_KEY }, shopify: { connected: !!(process.env.SHOPIFY_STORE && process.env.SHOPIFY_TOKEN) }, items: [] };
  const jobs = [];
  if (out.stripe.connected) jobs.push(stripe(process.env.STRIPE_KEY).then(x => { out.items.push(...x); }, e => { out.stripe.error = String(e.message || e); }));
  if (out.shopify.connected) jobs.push(shopify(process.env.SHOPIFY_STORE, process.env.SHOPIFY_TOKEN).then(x => { out.items.push(...x); }, e => { out.shopify.error = String(e.message || e); }));
  await Promise.all(jobs);
  out.items.sort((a, b) => a.date.localeCompare(b.date));
  return json(out);
};
