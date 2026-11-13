// GIGAPLUG - utils.js - How MENU looks on WhatsApp
function formatMenu(plans) {
  let msg = `*Welcome to GIGAPLUG* \nCheap Data, Fast Delivery, 24/7\n\nSend the ID number of the plan you want.\nExample: Send *2* for plan ID 2\n\n`;
  const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE'];
  for (const net of networks) {
    const netPlans = plans.filter(p => p.network === net);
    if (netPlans.length === 0) continue;
    msg += `*--- ${net} ---*\n`;
    const types = ['SME', 'AWOOF', 'GIFTING', 'CG'];
    for (const type of types) {
      const typePlans = netPlans.filter(p => p.type === type);
      if (typePlans.length === 0) continue;
      msg += `*${type}*\n`;
      typePlans.forEach(p => { msg += `${p.id}. ${p.name} - ₦${p.selling} (${p.validity})\n`; });
      msg += `\n`;
    }
  }
  msg += `Send any message anytime to see this list again.`;
  return msg;
}
module.exports = { formatMenu };
