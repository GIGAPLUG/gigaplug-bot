// GIGAPLUG - hub.js - Delivers data via Data24. NO URL, NO KEY inside. Both from Render.
const axios = require('axios');

async function deliverData(phone, plan) {
  try {
    let baseUrl = (process.env.HUB_API_URL || '').trim().replace(/\/$/, '');
    const buyUrl = baseUrl.endsWith('/buy') ? baseUrl : `${baseUrl}/buy`;
    console.log(`GIGAPLUG: Delivering ${plan.network} ${plan.type} ${plan.name} to ${phone}`);
    const res = await axios.post(buyUrl, {
      network: plan.network,
      plan_id: plan.id,
      plan: plan.code,
      phone: phone,
      type: plan.type
    }, { headers: { Authorization: `Bearer ${process.env.HUB_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 30000 });
    return { success: true, data: res.data };
  } catch (e) {
    console.log("HUB Error", e.response?.data || e.message);
    return { success: false };
  }
}

module.exports = { deliverData };
