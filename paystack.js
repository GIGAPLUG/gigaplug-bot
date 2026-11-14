const axios = require("axios");
const crypto = require("crypto");

const API = "https://api.paystack.co";

function requiredSecret() {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY is missing.");
  }

  return process.env.PAYSTACK_SECRET_KEY;
}

function headers() {
  return {
    Authorization: `Bearer ${requiredSecret()}`,
    "Content-Type": "application/json"
  };
}

// Creates a phone-derived email so the customer
// does not have to provide an email address.

function paymentEmail(phone) {
  const digits = String(phone).replace(/\D/g, "");

  const domain =
    process.env.PAYMENT_EMAIL_DOMAIN ||
    "customers.gigaplug.ng";

  return `${digits}@${domain}`;
}

async function initializePayment({
  phone,
  amountNaira,
  reference,
  callbackUrl,
  metadata
}) {
  const body = {
    email: paymentEmail(phone),
    amount: Math.round(amountNaira * 100),
    currency: "NGN",
    reference,
    callback_url: callbackUrl,
    channels: [
      "bank",
      "card",
      "ussd",
      "bank_transfer"
    ],
    metadata
  };

  const response = await axios.post(
    `${API}/transaction/initialize`,
    body,
    {
      headers: headers(),
      timeout: 20000
    }
  );

  if (
    !response.data ||
    !response.data.status ||
    !response.data.data?.authorization_url
  ) {
    throw new Error(
      response.data?.message ||
      "Paystack could not create checkout."
    );
  }

  return response.data.data;
}

async function verifyPayment(reference) {
  const response = await axios.get(
    `${API}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: headers(),
      timeout: 20000
    }
  );

  return response.data?.data;
}

function verifyWebhookSignature(rawBody, signature) {
  if (!signature || !rawBody) {
    return false;
  }

  const expected = crypto
    .createHmac("sha512", requiredSecret())
    .update(rawBody)
    .digest();

  const received = Buffer.from(signature, "hex");

  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(expected, received)
  );
}

module.exports = {
  initializePayment,
  verifyPayment,
  verifyWebhookSignature
};
