function formatMenu(plans) {
  let msg = "*GIGAPLUG DATA MENU* 🔌\n";
  const types = ["SME", "AWOOF", "GIFTING", "CG", "SMS"];
  types.forEach(t => {
    const filtered = plans.filter(p => p.type === t);
    if (filtered.length > 0) {
      msg += `\n*--- ${t} ---*\n`;
      filtered.slice(0, 10).forEach(p => { msg += `ID ${p.id} - ${p.network} ${p.name} - ₦${p.selling}\n`; });
    }
  });
  msg += `\nReply with ID. Example: 2\nThen send phone number`;
  return msg;
}
module.exports = { formatMenu };
