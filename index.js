// FILE: index.js - WHATSAPP ONLY - NO SMS
const express = require('express');
const axios = require('axios');
const { getPlanPrice } = require('./plans');
const { getToken, validateToken } = require('./utils');
const { createOrder } = require('./hub');
const { createPaymentLink, verifyPayment } = require('./paystack');

const app = express();
app.use(express.json());

// This is where we keep customers who are buying
const users = {};

// STEP 1: Customer sends WhatsApp message
// This is for WhatsApp ONLY
app.post('/whatsapp-webhook', async (req, res) => {
  try {
    const body = req.body;
    // Get phone and message from WhatsApp
    const phone = body.phone || body.from;
    const text = (body.message || body.text || '').trim().toLowerCase();

    if (!phone) return res.json({ ok: true });

    // If customer is new, show welcome
    if (!users[phone]) {
      users[phone] = { step: 'menu' };
      return res.json({ reply: "Welcome to GigaPlug! Send 1 for MTN, 2 for Airtel, 3 for Glo, 4 for 9mobile" });
    }

    const user = users[phone];

    // Customer picks network
    if (user.step === 'menu') {
      if (text === '1') user.network = 'MTN';
      else if (text === '2') user.network = 'Airtel';
      else if (text === '3') user.network = 'Glo';
      else if (text === '4') user.network = '9mobile';
      else return res.json({ reply: "Send 1 for MTN, 2 for Airtel, 3 for Glo, 4 for 9mobile" });
      user.step = 'plan';
      return res.json({ reply: `You picked ${user.network}. Send plan size, e.g. 1GB, 2GB, 5GB` });
    }

    // Customer picks plan
    if (user.step === 'plan') {
      user.plan = text.toUpperCase();
      user.price = getPlanPrice(user.network, user.plan);
      if (!user.price) return res.json({ reply: "That plan is not available. Send 1GB, 2GB, 5GB" });
      user.step = 'phone';
      return res.json({ reply: `Plan is ${user.plan} for ${user.network} - N${user.price}. Send the phone number to recharge` });
    }

    // Customer sends phone to recharge
    if (user.step === 'phone') {
      user.targetPhone = text.replace(/[^0-9]/g, '');
      user.step = 'pay';
      const link = await createPaymentLink(user.price, user.targetPhone, user.network, user.plan);
      return res.json({ reply: `Pay here to complete: ${link}` });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.log(e);
    return res.json({ ok: true });
  }
});

// STEP 2: Paystack tells us payment is done
app.post('/paystack-webhook', async (req, res) => {
  try {
    const ref = req.body.data.reference;
    const verify = await verifyPayment(ref);
    if (verify.status === true) {
      const meta = verify.data.metadata;
      // Buy data from Hub
      await createOrder(meta.network, meta.plan, meta.phone);
      console.log("Order done for " + meta.phone);
    }
    return res.json({ ok: true });
  } catch (e) {
    console.log(e);
    return res.json({ ok: true });
  }
});

// STEP 3: Hub tells us data is delivered
app.post('/data24-webhook', async (req, res) => {
  console.log("Delivery update:", req.body);
  return res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("GigaPlug WhatsApp Bot Running on " + PORT));
