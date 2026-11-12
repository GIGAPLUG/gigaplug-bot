const axios = require('axios');
function parseSmsOrder(smsText) {
  const text = smsText.toUpperCase().trim();
  const phoneMatch = text.match(/0[789]\d{9}/);
  const phone = phoneMatch ? phoneMatch[0] : null;
  let network = "MTN"; if (text.includes("GLO")) network = "GLO"; else if (text.includes("AIRTEL")) network = "AIRTEL"; else if (text.includes("9MOBILE")) network = "9MOBILE";
  let type = "SME"; if (text.includes("AWOOF")) type = "AWOOF"; else if (text.includes("GIFTING")) type = "GIFTING"; else if (text.includes("CG") || text.includes("CORPORATE")) type = "CG"; else if (text.includes("SMS")) type = "SMS";
  let size = "1GB"; if (text.includes("500MB")) size = "500MB"; else if (text.includes("2GB")) size = "2GB"; else if (text.includes("3GB")) size = "3GB"; else if (text.includes("5GB")) size = "5GB"; else if (text.includes("10GB")) size = "10GB";
  console.log(`BOSS SEE: Customer want ${size} ${type} for ${phone} - Network: ${network} - Raw: ${text}`);
  return { phone, network, type, size, raw: text };
}
async function sendSms(toPhone, message) {
  try { const res = await axios.post('https://api.ng.termii.com/api/sms/send', { to: toPhone, from: "GigaPlug", sms: message, type: "plain", channel: "generic", api_key: process.env.TERMII_API_KEY }); return res.data; } catch (e) { console.log('SMS Error', e.response?.data || e.message); }
}
module.exports = { parseSmsOrder, sendSms };
