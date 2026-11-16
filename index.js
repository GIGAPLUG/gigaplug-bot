require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const qrcode = require("qrcode-terminal");

const { Client, LocalAuth } = require("whatsapp-web.js");

const { NETWORKS, getPlans } = require("./plans");

const { makeReference, normalizePhone } = require("./utils");

const {
  initializePayment,
  verifyPayment,
  verifyWebhookSignature
} = require("./paystack");

const { purchaseData } = require("./hub");

const PORT = Number(process.env.PORT || 3000);

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");

const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

const WEBHOOK_PATH = "/paystack-webhook";
const CALLBACK_PATH = "/payment-callback";

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, "{}");
}

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeOrders(orders) {
  const temp = `${ORDERS_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(orders, null, 2));
  fs.renameSync(temp, ORDERS_FILE);
}

const orders = readOrders();
const sessions = new Map();

const app = express();

// PAYSTACK WEBHOOK

app.post(
  WEBHOOK_PATH,
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-paystack-signature"];

      if (!verifyWebhookSignature(req.body, signature)) {
        return res.sendStatus(401);
      }

      const event = JSON.parse(req.body.toString("utf8"));

      res.sendStatus(200);

      if (event.event === "charge.success" && event.data?.reference) {
        await processPaidReference(event.data.reference);
      }
    } catch (error) {
      console.error("Webhook error:", error.message);

      if (!res.headersSent) {
        res.sendStatus(400);
      }
    }
  }
);

app.use(express.json());

// HOME PAGE

app.get("/", (req, res) => {
  res.send("GigaPlug WhatsApp Bot is running.");
});

// PAYMENT CALLBACK

app.get(CALLBACK_PATH, async (req, res) => {
  const reference = String(req.query.reference || "");

  if (reference) {
    try {
      await processPaidReference(reference);
    } catch (error) {
      console.error("Callback error:", error.message);
    }
  }

  res.send(
    "Thank you. GigaPlug is checking your payment. Return to WhatsApp for your order update."
  );
});

// HEALTH CHECK

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "GigaPlug" });
});

// WHATSAPP CLIENT

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "gigaplug",
    dataPath:
      process.env.WA_AUTH_PATH ||
      path.join(DATA_DIR, "whatsapp-auth")
  }),

  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  }
});

// SEND WHATSAPP UPDATE

async function sendOrderUpdate(chatId, text) {
  if (client.info) {
    try {
      await client.sendMessage(chatId, text);
    } catch (error) {
      console.error("WhatsApp notification failed:", error.message);
    }
  }
}

// PROCESS CONFIRMED PAYMENT

async function processPaidReference(reference) {
  const order = orders[reference];

  if (
    !order ||
    order.status === "delivered" ||
    order.status === "processing"
  ) {
    return;
  }

  const payment = await verifyPayment(reference);

  if (
    !payment ||
    payment.status !== "success" ||
    payment.currency !== "NGN" ||
    Number(payment.amount) !== Number(order.amountKobo)
  ) {
    console.log("Payment not confirmed or amount mismatch:", reference);
    return;
  }

  order.status = "processing";
  order.paidAt = payment.paid_at || new Date().toISOString();

  writeOrders(orders);

  try {
    const result = await purchaseData({
      networkId: order.networkId,
      planId: order.planId,
      phone: order.recipientPhone,
      customRef: order.supplierRef
    });

    if (result && result.status === true) {
      order.status = "delivered";
      order.supplierResponse = result;
      order.deliveredAt = new Date().toISOString();

      writeOrders(orders);

      await sendOrderUpdate(
        order.chatId,
        `✅ GigaPlug: Your ${order.network} ${order.planName} purchase for ${order.recipientPhone} has been submitted successfully. Thank you for using GigaPlug!`
      );
    } else {
      order.status = "supplier_review";
      order.supplierResponse = result || null;

      writeOrders(orders);

      await sendOrderUpdate(
        order.chatId,
        `Your payment is confirmed, but data delivery needs checking. Order reference: ${reference}. Please do not pay again. Contact GigaPlug support.`
      );
    }
  } catch (error) {
    order.status = "supplier_review";
    order.supplierError = error.response?.data || error.message;

    writeOrders(orders);

    await sendOrderUpdate(
      order.chatId,
      `Your payment is confirmed, but data delivery needs a manual check. Order reference: ${reference}. Please do not pay again.`
    );
  }
}

// WHATSAPP QR CODE

client.on("qr", qr => {
  console.log("Scan this QR code with WhatsApp > Linked devices:");
  qrcode.generate(qr, { small: true });
});

client.on("loading_screen", (percent, message) => {
  console.log("WhatsApp loading:", percent, message);
});

client.on("authenticated", () => {
  console.log("WhatsApp authenticated successfully.");
});

client.on("ready", () => {
  console.log("GigaPlug WhatsApp is ready!");
});

client.on("auth_failure", message => {
  console.error("WhatsApp authentication failure:", message);
});

client.on("disconnected", reason => {
  console.log("WhatsApp disconnected:", reason);
});

// MAIN MENU

function menuText() {
  return `WELCOME TO GIGAPLUG!
Where we sell data.

1. Buy Data
2. Check Order

Reply with 1 or 2.`;
}

// NETWORK MENU

function networkText() {
  return `Choose your network:

1. MTN
2. 9mobile
3. Glo
4. Airtel

Reply with the number.`;
}

// RECEIVE CUSTOMER MESSAGES

client.on("message", async message => {
  try {
    if (
      message.from.endsWith("@g.us") ||
      message.from === "status@broadcast"
    ) {
      return;
    }

    const chatId = message.from;
    const text = String(message.body || "").trim();
    const lower = text.toLowerCase();

    let session = sessions.get(chatId) || { step: "menu" };

    if (["hi", "hello", "hey", "menu", "start"].includes(lower)) {
      sessions.set(chatId, { step: "menu" });
      return message.reply(menuText());
    }

    // MAIN MENU

    if (session.step === "menu" || text === "1" || text === "2") {
      if (text === "1" || lower === "buy data") {
        sessions.set(chatId, { step: "network" });
        return message.reply(networkText());
      }

      if (text === "2" || lower === "check order") {
        sessions.set(chatId, { step: "order_lookup" });
        return message.reply("Send your GigaPlug order reference.");
      }

      return message.reply(menuText());
    }

    // CHECK ORDER

    if (session.step === "order_lookup") {
      const order = orders[text];

      if (!order || order.chatId !== chatId) {
        return message.reply(
          "I couldn't find that order. Check the reference and try again."
        );
      }

      return message.reply(
        `Order: ${text}\nStatus: ${order.status}`
      );
    }

    // NETWORK SELECTION

    if (session.step === "network") {
      const networkId = {
        "1": "1",
        "2": "2",
        "3": "3",
        "4": "4"
      }[text];

      if (!networkId) {
        return message.reply(networkText());
      }

      const plans = getPlans(networkId);

      if (!plans.length) {
        return message.reply(
          "There are currently no verified bundles for this network. Please choose another network or type MENU."
        );
      }

      session = { step: "plan", networkId };
      sessions.set(chatId, session);

      const lines = plans.map(
        (plan, index) =>
          `${index + 1}. ${plan.name} — ₦${plan.price.toLocaleString("en-NG")}`
      );

      return message.reply(
        `${NETWORKS[networkId]} data bundles:\n\n${lines.join("\n")}\n\nReply with the bundle number.`
      );
    }

    // PLAN SELECTION

    if (session.step === "plan") {
      const plans = getPlans(session.networkId);
      const index = Number(text) - 1;

      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= plans.length
      ) {
        return message.reply(
          "Please reply with one of the bundle numbers shown."
        );
      }

      const plan = plans[index];

      sessions.set(chatId, {
        step: "phone",
        networkId: session.networkId,
        planId: plan.id,
        planName: plan.name,
        price: plan.price
      });

      return message.reply(
        `You selected ${plan.name} for ₦${plan.price.toLocaleString("en-NG")}.\n\nSend the 11-digit Nigerian phone number that should receive the data.`
      );
    }

    // PHONE NUMBER AND PAYMENT

    if (session.step === "phone") {
      const phone = normalizePhone(text);

      if (!phone) {
        return message.reply(
          "Enter a valid Nigerian phone number, for example 08012345678."
        );
      }

      const reference = makeReference();
      const supplierRef = makeReference("GPD");

      if (
        !process.env.PUBLIC_BASE_URL ||
        !process.env.PUBLIC_BASE_URL.startsWith("https://")
      ) {
        return message.reply(
          "GigaPlug payment setup is not complete yet. Please contact support."
        );
      }

      const order = {
        reference,
        supplierRef,
        chatId,
        customerPhone: chatId.split("@")[0],
        recipientPhone: phone,
        networkId: session.networkId,
        network: NETWORKS[session.networkId],
        planId: session.planId,
        planName: session.planName,
        amountNaira: session.price,
        amountKobo: session.price * 100,
        status: "awaiting_payment",
        createdAt: new Date().toISOString()
      };

      const callbackUrl =
        `${process.env.PUBLIC_BASE_URL}${CALLBACK_PATH}`;

      const checkout = await initializePayment({
        phone: order.customerPhone,
        amountNaira: order.amountNaira,
        reference,
        callbackUrl,
        metadata: {
          order_reference: reference,
          recipient_phone: phone,
          network: order.network,
          plan_id: order.planId,
          plan_name: order.planName
        }
      });

      if (!checkout || !checkout.authorization_url) {
        throw new Error("Paystack did not return a checkout URL.");
      }

      order.checkoutUrl = checkout.authorization_url;

      orders[reference] = order;
      writeOrders(orders);

      sessions.delete(chatId);

      return message.reply(
        `GigaPlug order summary\n\n` +
        `Network: ${order.network}\n` +
        `Bundle: ${order.planName}\n` +
        `Recipient: ${phone}\n` +
        `Amount: ₦${order.amountNaira.toLocaleString("en-NG")}\n` +
        `Reference: ${reference}\n\n` +
        `Pay securely using this Paystack checkout link:\n${checkout.authorization_url}\n\n` +
        `Choose bank transfer on Paystack checkout if it is available. Your data will only be requested after Paystack confirms your payment.`
      );
    }

    return message.reply("Type MENU to start again.");

  } catch (error) {
    console.error(
      "Message handler error:",
      error.response?.data || error.message
    );

    return message.reply(
      "Sorry, GigaPlug could not process that request right now. Please try again shortly or type MENU."
    );
  }
});

// START WEB SERVER

app.listen(PORT, () => {
  console.log(`GigaPlug web server listening on port ${PORT}`);
});

// START WHATSAPP

client.initialize().catch(error => {
  console.error("WhatsApp startup error:", error);
});
