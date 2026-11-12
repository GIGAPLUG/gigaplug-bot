const express = require('express');
const bodyParser = require('body-parser');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const plans = require('./plans');
const { createVirtualAccount } = require('./paystack');
const { deliverData } = require('./hub');
const { parseSmsOrder, sendSms } = require('./sms');
const { formatMenu } = require('./utils');
const app = express();
app.use(bodyParser.json());
let qrCodeData = "";
const orders = {};
const client = new Client({ authStrategy: new LocalAuth(), puppeteer: { args: ['--no-sandbox'] } });
client.on('qr', qr => { qrcode.toDataURL(qr, (err, url) => { qrCodeData = url; }); });
client.on('ready', () => console.log('WhatsApp Ready! BOSS SEE: Bot Live'));
client.on('message', async msg => {
  if (msg.from.includes('@g.us')) return;
  const text = msg.body.trim(); const chatId = msg.from;
  if (['menu','hi','hello'].includes(text.toLowerCase())) return client.sendMessage(chatId, formatMenu(plans));
  const planId = parseInt(text);
  if (!isNaN(planId)) {
    const plan = plans.find(p => p.id === planId);
    if (plan) { orders[chatId] = { plan: plan, step: 'await_phone' }; return client.sendMessage(chatId, `You choose *${plan.network} ${plan.type} ${plan.name} - ₦${plan.selling}*\nNow send phone number`); }
  }
  if (text.match(/0[789]\d{9}/) && orders[chatId] && orders[chatId].step === 'await_phone') {
    const phone = text.match(/0[789]\d{9}/)[0]; const plan = orders[chatId].plan;
    orders[phone] = { plan: plan, expected: plan.selling, network: plan.network, type: plan.type, chatId: chatId };
    const dva = await createVirtualAccount(`${phone}@gigaplug.com`, phone, plan.id);
    if (dva) { await client.sendMessage(chatId, `*GIGAPLUG PAYMENT*\n${plan.network} ${plan.type} ${plan.name} is *₦${plan.selling}*\nBank: ${dva.bank_name}\nAccount: ${dva.account_number}\nName: ${dva.account_name}\n\nPay EXACT ₦${plan.selling}. If not exact, HOLD. No data.\nData go enter ${phone} auto after confirm.`); console.log(`BOSS SEE: WhatsApp order - ${plan.network} ${plan.type} ${plan.name} for ${phone} - Expected ₦${plan.selling}`); }
    orders[chatId].step = 'done';
  }
});
client.initialize();
app.get('/', (req, res) => res.send('GIGAPLUG BOT IS LIVE'));
app.get('/qr', (req, res) => { if (qrCodeData) res.send(`<img src="${qrCodeData}" /><p>Scan with WhatsApp > Linked Devices</p>`); else res.send('QR not ready, refresh in 10s'); });
app.post('/paystack-webhook', async (req, res) => {
  const event = req.body;
  if (event.event === 'charge.success') {
    const amountPaid = event.data.amount / 100; const phoneFromEmail = event.data.customer.email.split('@')[0]; const finalPhone = event.data.customer?.phone || phoneFromEmail;
    const order = orders[finalPhone]; if (!order) { console.log(`BOSS SEE: Payment from unknown ${finalPhone} - ₦${amountPaid} - HOLD`); return res.sendStatus(200); }
    console.log(`BOSS SEE: Paystack confirm - ${finalPhone} paid ₦${amountPaid} - Expected ₦${order.expected} - ${order.network} ${order.type}`);
    if (amountPaid === order.expected) {
      const delivered = await deliverData(finalPhone, order.plan);
      if (delivered.success) { if (order.chatId) await client.sendMessage(order.chatId, `✅ Payment ₦${amountPaid} EXACT. Your ${order.network} ${order.type} ${order.plan.name} don deliver to ${finalPhone}.`); await sendSms(finalPhone, `GIGAPLUG: Your ${order.plan.name} don deliver to ${finalPhone}.`); }
    } else {
      console.log(`BOSS SEE: NOT EXACT - HOLD - ${finalPhone} paid ₦${amountPaid} instead of ₦${order.expected} - NO DATA`);
      if (order.chatId) await client.sendMessage(order.chatId, `⚠️ You paid ₦${amountPaid} but expected ₦${order.expected}. Money on HOLD. No data. Contact admin.`);
    }
  }
  res.sendStatus(200);
});
app.post('/sms-webhook', async (req, res) => {
  const fromPhone = req.body.from || req.body.phone; const message = req.body.message || req.body.sms || req.body.text;
  const { phone, network, type, size } = parseSmsOrder(message); const deliveryPhone = phone || fromPhone;
  const plan = plans.find(p => p.network === network && p.type === type && p.size === size) || plans.find(p => p.id === 2);
  orders[deliveryPhone] = { plan: plan, expected: plan.selling, network: network, type: type, chatId: null };
  const dva = await createVirtualAccount(`${deliveryPhone}@gigaplug.com`, deliveryPhone, plan.id);
  if (dva) { await sendSms(fromPhone, `GIGAPLUG: ${plan.network} ${plan.type} ${plan.name} is ₦${plan.selling}\nBank: ${dva.bank_name}\nAccount: ${dva.account_number}\nPay EXACT ₦${plan.selling}. HOLD if not exact. Data to ${deliveryPhone} auto.`); }
  res.sendStatus(200);
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
