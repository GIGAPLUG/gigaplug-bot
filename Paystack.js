const axios = require('axios');
async function createVirtualAccount(email, phone, planId) {
  try {
    const res = await axios.post('https://api.paystack.co/dedicated_account', {
      customer: { email: email, first_name: "GigaPlug", last_name: phone, phone: phone },
      preferred_bank: "wema-bank"
    }, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });
    if (res.data.status) {
      return { account_number: res.data.data.account_number, account_name: res.data.data.account_name, bank_name: res.data.data.bank.name };
    }
  } catch (e) { console.log("Paystack DVA Error", e.response?.data || e.message); }
  return null;
}
module.exports = { createVirtualAccount };
