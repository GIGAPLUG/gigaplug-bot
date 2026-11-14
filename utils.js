const crypto = require("crypto");

function sellingPrice(cost) {
  let markup;
  let step;

  if (cost < 1000) {
    markup = 50;
    step = 50;
  } else if (cost <= 3000) {
    markup = 100;
    step = 100;
  } else {
    markup = 200;
    step = 100;
  }

  return Math.ceil((cost + markup) / step) * step;
}

function makeReference(prefix = "GP") {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

function normalizePhone(input) {
  let digits = String(input || "").replace(/\D/g, "");

  if (digits.startsWith("234")) {
    digits = "0" + digits.slice(3);
  }

  if (digits.length === 10) {
    digits = "0" + digits;
  }

  if (!/^0\d{10}$/.test(digits)) {
    return null;
  }

  return digits;
}

function toWhatsAppId(phone) {
  return `${phone.replace(/^0/, "234")}@c.us`;
}

module.exports = {
  sellingPrice,
  makeReference,
  normalizePhone,
  toWhatsAppId
};
