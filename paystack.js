// GIGAPLUG - paystack.js - MULTIPLE ACCOUNTS - One new account for EVERY order
// NO KEY inside. Key from Render: PAYSTACK_SECRET_KEY
const axios = require('axios');

async function createVirtualAccount(phone, planId) {
  try {
    // Create a NEW unique email for EVERY order, so Paystack gives a NEW account every time
    const uniqueId = Date.now() + '_' + Math.floor(Math.random() * 10000);
    const uniqueEmail = `${phone}_${uniqueId}@gigaplug.com`;
    console.log(`GIGAPLUG: Requesting NEW Paystack account for ${phone}, email ${uniqueEmail}`);
    const res = await axios.post('https://api.paystack.co/dedicated_account/assign', {
      email: uniqueEmail,
      first_name: 'GigaPlug',
      last_name: 'Customer',
      phone: phone,
      preferred_bank: 'wema-bank',
      country: 'NG'
    }, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' } });
    const data = res.data.data;
    return {
      bank_name: data.bank?.name || data.bank_name || 'Wema Bank',
      account_number: data.account_number,
      account_name: data.account_name,
      email: uniqueEmail
    };
  } catch (e) {
    console.log('Paystack Error', e.response?.data || e.message);
    return null;
  }
}

module.exports = { createVirtualAccount };
