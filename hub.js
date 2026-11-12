const axios = require('axios');
async function deliverData(phone, plan) {
  try {
    console.log(`BOSS SEE: Delivering ${plan.network} ${plan.type} ${plan.name} to ${phone} - ID ${plan.id}`);
    const res = await axios.post(process.env.HUB_API_URL, { network: plan.network, type: plan.type, plan: plan.code, phone: phone, plan_id: plan.id }, { headers: { Authorization: `Bearer ${process.env.HUB_API_KEY}` } });
    return { success: true, data: res.data };
  } catch (e) { console.log("HUB Error", e.response?.data || e.message); return { success: false }; }
}
module.exports = { deliverData };
