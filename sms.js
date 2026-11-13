// GIGAPLUG - sms.js - ONLY sends SMS to a customer who already ordered. Never to random people.
const axios = require('axios');

async function sendSms(phone, message) {
  try {
    if (!phone) return false;
    console.log(`GIGAPLUG: Sending SMS to ${phone}`);
    await axios.post('https://api.ng.termii.com/api/sms/send', {
      to: phone,
      from: 'GigaPlug',
      sms: message,
      type: 'plain',
      api_key: process.env.TERMII_API_KEY,
      channel: 'generic'
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 });
    console.log('GIGAPLUG: SMS sent to', phone);
    return true;
  } catch (e) {
    console.log('GIGAPLUG: SMS failed for', phone, e.response?.data || e.message);
    return false;
  }
}

function parseSmsOrder(message) {
  const text = (message || '').toUpperCase();
  const phoneMatch = text.match(/0[789]\d{9}/);
  return { phone: phoneMatch ? phoneMatch[0] : null, network: 'MTN', type: 'SME', size: '1GB' };
}

module.exports = { sendSms, parseSmsOrder };
