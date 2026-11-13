// GIGAPLUG - plans.js - NO URL, NO KEY inside. Both come from Render.
const axios = require('axios');

function calculateSellingPrice(cost) {
  const c = Number(cost);
  let raw = c < 1500 ? c + 50 : c + 200;
  return Math.ceil(raw / 50) * 50;
}

function detectType(name) {
  const n = (name || '').toUpperCase();
  if (n.includes('AWOOF')) return 'AWOOF';
  if (n.includes('GIFTING')) return 'GIFTING';
  if (n.includes('CORPORATE') || n.includes(' CG ')) return 'CG';
  if (n.includes('SMS')) return 'SMS';
  return 'SME';
}

function detectNetwork(plan, name) {
  if (plan.network) return String(plan.network).toUpperCase();
  const n = (name || '').toUpperCase();
  if (n.includes('GLO')) return 'GLO';
  if (n.includes('AIRTEL')) return 'AIRTEL';
  if (n.includes('9MOBILE')) return '9MOBILE';
  return 'MTN';
}

let cachedPlans = null, lastFetch = 0;

async function getPlans() {
  const now = Date.now();
  if (cachedPlans && (now - lastFetch) < 10 * 60 * 1000) return cachedPlans;
  try {
    let baseUrl = (process.env.HUB_API_URL || '').trim().replace(/\/$/, '');
    let res;
    try {
      res = await axios.get(`${baseUrl}/plans`, { headers: { Authorization: `Bearer ${process.env.HUB_API_KEY}` }, timeout: 20000 });
    } catch (e) {
      res = await axios.get(`${baseUrl}/services`, { headers: { Authorization: `Bearer ${process.env.HUB_API_KEY}` }, timeout: 20000 });
    }
    const rawList = res.data.data || res.data.plans || res.data.services || res.data || [];
    const list = Array.isArray(rawList) ? rawList : [];
    const plans = list.map((p) => {
      const name = p.name || p.plan_name || p.title || 'Data Plan';
      const cost = Number(p.price || p.cost || p.amount || 0);
      const selling = calculateSellingPrice(cost);
      return {
        id: Number(p.id || p.plan_id),
        network: detectNetwork(p, name),
        type: detectType(name),
        name: name,
        size: p.size || p.data || p.plan || '',
        validity: p.validity || p.duration || '30 Days',
        cost: cost,
        selling: selling,
        profit: selling - cost,
        code: p.code || p.plan_code || String(p.id)
      };
    }).filter(p => p.id && p.cost > 0);
    console.log(`GIGAPLUG: Fetched ${plans.length} plans from Data24`);
    cachedPlans = plans; lastFetch = now; return plans;
  } catch (e) {
    console.log('GIGAPLUG: Failed to fetch plans', e.response?.data || e.message);
    return cachedPlans || [];
  }
}

module.exports = { getPlans, calculateSellingPrice };
