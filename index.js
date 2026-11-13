// GIGAPLUG - index.js - MAIN BOT - QR CODE SCAN VERSION ONLY
// NO TOKEN, NO PHONE NUMBER ID, NO VERIFY TOKEN
// NO KEYS, NO URLS inside. All from Render.
const express = require('express');
const bodyParser = require('body-parser');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { getPlans } = require('./plans');
const { createVirtualAccount } = require('./paystack');
const { deliverData } = require('./hub');
const { sendSms } = require('./sms');
const { formatMenu } = require('./utils');

const app = express();
app.use(bodyParser.json());

let qrCodeData = "";
const orders = {};
const ordersByEmail = {};
const ordersByAccount = {};

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', qr => {
  qrcode.toDataURL(qr, (err, url) => { qrCodeData = url; });
});

client.on('ready', () => console.log('GIGAPLUG: WhatsApp Ready! Bot Live'));

client.on('message', async msg => {
  try {
    if (msg.from.includes('@g.us')) return;
    const text = msg.body.trim();
    const chatId = msg.from;

    // STEP 1: Customer sends a plan ID number like 2
    const planId = parseInt(text);
    if (!isNaN(planId) && text.length < 5) {
      const plans = await getPlans();
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        orders[chatId] = { plan: plan, step: 'await_phone' };
        return client.sendMessage(chatId, `You choose *${plan.network} ${plan.type} ${plan.name} - ₦${plan.selling}*\nNow send the phone number to recharge. Example: 08031234567`);
      }
      const allPlans = await getPlans();
      return client.sendMessage(chatId, formatMenu(allPlans));
    }

    // STEP 2: Customer sends a phone number and he already chose a plan
    if (text.match(/0[789]\d{9}/) && orders[chatId] && orders[chatId].step === 'await_phone') {
      const phone = text.match(/0[789]\d{9}/)[0];
      const plan = orders[chatId].plan;
      const dva = await createVirtualAccount(phone, plan.id);
      if (dva) {
        const order = { plan: plan, expected: plan.selling, network: plan.network, type: plan.type, chatId: chatId, phone: phone, account_number: dva.account_number, email: dva.email };
        orders[phone] = order;
        ordersByEmail[dva.email] = order;
        ordersByAccount[dva.account_number] = order;
        await client.sendMessage(chatId, `*GIGAPLUG PAYMENT*\n${plan.network} ${plan.type} ${plan.name} is *₦${plan.selling}*\nBank: ${dva.bank_name}\nAccount: ${dva.account_number}\nName: ${dva.account_name}\n\nThis account is for YOU ONLY for this order. Pay EXACT ₦${plan.selling}. If not exact, HOLD. No data.\nData will enter ${phone} automatically after confirmation.`);
      } else {
        await client.sendMessage(chatId, 'Sorry, could not generate payment account. Try again or contact admin.');
      }
      orders[chatId].step = 'done';
      return;
    }

    // STEP 3: FOR ANY OTHER MESSAGE - A, B, C, D, hello, anything - Show MENU only
    const plans = await getPlans();
    if (!plans || plans.length === 0) {
      return client.sendMessage(chatId, 'Hello! Welcome to GigaPlug. Plans are loading. Send any message again in 1 minute to see MENU.');
    }
    return client.sendMessage(chatId, formatMenu(plans));

  } catch (e) {
    console.log('GIGAPLUG WhatsApp Error', e.message);
  }
});

client.initialize();

app.get('/', (req, res) => res.send('GIGAPLUG BOT IS LIVE'));

app.get('/qr', (req, res) => {
  if (qrCodeData) res.send(`<img src="${qrCodeData}" /><p>Scan with WhatsApp > Linked Devices</p>`);
  else res.send('QR not ready, refresh in 10 seconds');
});

// WEBHOOK 1: PAYSTACK - Paystack tells bot: Customer has paid
app.post('/paystack-webhook', async (req, res) => {
  try {
    const event = req.body;
    if (event.event === 'charge.success') {
      const amountPaid = event.data.amount / 100;
      const customerEmail = event.data.customer.email;
      const phoneFromEmail = customerEmail.split('@')[0].split('_')[0];
      const finalPhone = event.data.customer?.phone || phoneFromEmail;
      let order = ordersByEmail[customerEmail];
      if (!order && event.data.authorization?.account_number) order = ordersByAccount[event.data.authorization.account_number];
      if (!order) order = orders[finalPhone];
      if (!order) {
        console.log(`GIGAPLUG: Payment from unknown ${finalPhone} - ₦${amountPaid} - HOLD`);
        return res.sendStatus(200);
      }
      if (amountPaid === order.expected) {
        const delivered = await deliverData(order.phone || finalPhone, order.plan);
        if (delivered.success) {
          if (order.chatId) await client.sendMessage(order.chatId, `✅ PAYMENT SUCCESSFUL\n\nYou have bought ${order.network} ${order.type} ${order.plan.name} for ₦${amountPaid}.\n\nYour data has been transferred to ${order.phone || finalPhone} successfully.\n\nThank you for using GigaPlug.`);
          await sendSms(order.phone || finalPhone, `GIGAPLUG: PAYMENT SUCCESSFUL. You have bought ${order.plan.name} for N${amountPaid}. Your data has been transferred to ${order.phone || finalPhone} successfully. Thank you for using GigaPlug.`);
        } else {
          if (order.chatId) await client.sendMessage(order.chatId, `Payment received but delivery failed. Contact admin. Your money is safe.`);
        }
      } else {
        if (order.chatId) await client.sendMessage(order.chatId, `⚠️ You paid ₦${amountPaid} but expected ₦${order.expected}. Money on HOLD. No data. Contact admin.`);
      }
    }
    res.sendStatus(200);
  } catch (e) {
    console.log('Paystack Webhook Error', e.message);
    res.sendStatus(200);
  }
});

// WEBHOOK 2: DATA24 - Data24 tells bot: Delivery succeeded or failed
app.post('/data24-webhook', async (req, res) => {
  try {
    console.log('GIGAPLUG: Data24 Webhook received', req.body);
    const data = req.body;
    const phone = data.phone || data.msisdn || data.recipient;
    const status = (data.status || data.message || '').toString().toLowerCase();
    if (phone && (status.includes('success') || status.includes('delivered'))) {
      const order = orders[phone];
      if (order && order.chatId) {
        await client.sendMessage(order.chatId, `✅ PAYMENT SUCCESSFUL\n\nYour data has been transferred to ${phone} successfully.\n\nThank you for using GigaPlug.`);
      }
    }
    res.sendStatus(200);
  } catch (e) { console.log('Data24 Webhook Error', e.message); res.sendStatus(200); }
});

// WEBHOOK 3: TERMII - Termii tells bot: SMS delivered or failed
app.post('/termii-webhook', async (req, res) => {
  try {
    console.log('GIGAPLUG: Termii Webhook received', req.body);
    res.sendStatus(200);
  } catch (e) { console.log('Termii Webhook Error', e.message); res.sendStatus(200); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`GIGAPLUG Server running on ${PORT}`));
