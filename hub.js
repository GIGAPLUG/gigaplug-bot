// Data24/supplier integration. API URL and key are set only as hosting environment variables.
const axios = require('axios');

async function fetchSupplierPlans() {
  const base = String(process.env.HUB_API_URL || '').trim().replace(/\/+$/, '');
  const key = process.env.HUB_API_KEY;
  if (!base || !key) throw new Error('Missing HUB_API_URL or HUB_API_KEY.');
  const headers = { Authorization: `Bearer ${key}` };
  let lastError;
  for (const endpoint of ['/plans', '/services']) {
    try {
      const response = await axios.get(`${base}${endpoint}`, { headers, timeout: 20000 });
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Supplier plans could not be loaded.');
}

async function deliverData(phone, plan, reference) {
  const base = String(process.env.HUB_API_URL || '').trim().replace(/\/+$/, '');
  const key = process.env.HUB_API_KEY;
  if (!base || !key) throw new Error('Missing HUB_API_URL or HUB_API_KEY.');

  const url = base.endsWith('/buy') ? base : `${base}/buy`;
  const response = await axios.post(url, {
    network: plan.network,
    plan_id: plan.id,
    plan: plan.code || plan.id,
    phone,
    type: plan.type,
    reference
  }, {
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': reference
    },
    timeout: 45000
  });

  const body = response.data || {};
  const success = body.success === true || body.status === true ||
    ['success', 'successful', 'completed', 'delivered'].includes(String(body.status || '').toLowerCase());
  if (!success) {
    return { success: false, pending: Boolean(body.pending), data: body };
  }
  return { success: true, data: body };
}

module.exports = { fetchSupplierPlans, deliverData };
