const { sellingPrice } = require("./utils");

const NETWORKS = {
  "1": "MTN",
  "2": "9mobile",
  "3": "Glo",
  "4": "Airtel"
};

// Format: Network ID, Plan ID, Plan Name, Supplier Cost

const RAW_PLANS = [

  // =========================
  // MTN
  // =========================

  ["1", "2", "1GB [CG] - 1 day", 270],
  ["1", "3", "2.5GB [CG] - 1 day", 600],
  ["1", "18", "2GB Gifting - 2 Days", 737],
  ["1", "20", "1GB Gifting - 30 Days", 520],
  ["1", "21", "1.2GB Gifting - 7 Days", 739],
  ["1", "23", "1.5GB Gifting - 7 Days", 970],
  ["1", "24", "6GB Gifting - 7 Days", 2432],
  ["1", "31", "11GB Gifting - 7 Days", 3395],
  ["1", "32", "2GB Gifting - 30 Days", 1100],
  ["1", "33", "2.7GB Gifting - 30 Days", 1945],

  ["1", "114", "5GB SME - 7 Days", 1700],
  ["1", "115", "2GB SME - 30 Days", 900],
  ["1", "117", "100MB SME - 7 Days", 90],
  ["1", "118", "10GB SME - 30 Days", 3600],

  ["1", "165", "500MB SME2 - 30 Days", 140],
  ["1", "167", "2GB SME2 - 30 Days", 560],
  ["1", "168", "3GB SME2 - 30 Days", 840],
  ["1", "169", "5GB SME2 - 30 Days", 1400],
  ["1", "170", "10GB SME2 - 30 Days", 2800],

  ["1", "171", "750MB Data Coupon - 1 Week", 170],
  ["1", "172", "1GB Data Coupon - 1 Week", 225],
  ["1", "173", "1.5GB Data Coupon - 30 Days", 339],
  ["1", "174", "2GB Data Coupon - 30 Days", 450],
  ["1", "175", "3GB Data Coupon - 30 Days", 675],
  ["1", "176", "5GB Data Coupon - 30 Days", 1125],

  ["1", "177", "1GB Data Share - 7 Days", 395],
  ["1", "178", "2GB Data Share - 30 Days", 900],
  ["1", "179", "200MB Data Share - 7 Days", 150],
  ["1", "180", "5GB Data Share - 30 Days", 1600],
  ["1", "181", "1GB Data Share - 30 Days", 450],
  ["1", "182", "2GB Data Share - 7 Days", 790],
  ["1", "183", "3GB Data Share - 30 Days", 1200],
  ["1", "184", "500MB Data Share - 30 Days", 250],

  ["1", "185", "6GB Awoof Data - 7 Days", 2432],
  ["1", "186", "3.2GB Awoof Data - 2 Days", 973],
  ["1", "187", "11GB Awoof Data - 7 Days", 3404],

  ["1", "189", "3.5GB Gifting - 7 Days", 1459],
  ["1", "190", "150GB Gifting - 60 Days", 38900],
  ["1", "191", "12.5GB Gifting - 30 Days", 5349],
  ["1", "192", "800GB Gifting - Yearly", 121780],
  ["1", "193", "20GB Gifting - 30 Days", 7294],
  ["1", "194", "25GB Gifting - 30 Days", 8753],
  ["1", "195", "36GB Gifting - 30 Days", 10720],
  ["1", "196", "75GB Gifting - 30 Days", 17505],

  ["1", "205", "1GB SME - 30 Days", 450],
  ["1", "206", "1GB SME - 7 Days", 395],
  ["1", "207", "2GB SME - 7 Days", 790],
  ["1", "208", "3GB SME - 30 Days", 1200],
  ["1", "209", "5GB SME - 30 Days", 1800],

  ["1", "230", "1GB Gifting - 1 Day", 488],
  ["1", "231", "1.5GB Gifting - 2 Days", 584],
  ["1", "232", "230MB Gifting - 1 Day", 198],
  ["1", "233", "2.5GB Gifting - 2 Days", 876],
  ["1", "234", "110MB Gifting - 1 Day", 98],

  ["1", "236", "1.5GB Awoof Data - 7 Days", 970],
  ["1", "239", "1.5GB Awoof Data - 2 Days", 585],
  ["1", "240", "14.5GB Awoof Data - 30 Days", 4850],
  ["1", "241", "10GB Awoof Data - 30 Days", 3600],
  ["1", "242", "20GB Awoof Data - 7 Days", 4863],
  ["1", "243", "3.5GB Awoof Data - 7 Days", 1459],
  ["1", "244", "1GB Awoof Data - 7 Days", 400],
  ["1", "246", "2GB Awoof Data - 30 Days", 1040],
  ["1", "247", "5GB Awoof Data - 30 Days", 1800],
  ["1", "248", "1GB Awoof Data - 30 Days", 520],

  ["1", "249", "2GB Gifting - 30 Days", 1455],
  ["1", "250", "10GB Gifting - 30 Days", 4377],
  ["1", "251", "3.5GB Gifting - 30 Days", 2404],
  ["1", "252", "7GB Gifting - 30 Days", 3404],
  ["1", "253", "16.5GB Gifting - 30 Days", 6322],
  ["1", "254", "165GB Gifting - 30 Days", 34038],
  ["1", "255", "250GB Gifting - 30 Days", 53488],
  ["1", "256", "90GB Gifting - 2 Months", 24425],
  ["1", "257", "1GB Gifting - 7 Days", 420],
  ["1", "259", "20GB Gifting - 7 Days", 4863],
  ["1", "273", "10GB Data Share - 30 Days", 3300],
  ["1", "275", "2GB Gifting - 7 Days", 840],
  ["1", "280", "200MB SME - 7 Days", 150],
  ["1", "281", "15GB SME - 30 Days", 4500],

  // =========================
  // 9MOBILE
  // =========================

  ["2", "75", "500MB Gifting", 450],
  ["2", "76", "1.5GB Gifting", 850],
  ["2", "79", "7GB Weekly", 1350],
  ["2", "80", "4.5GB Gifting", 1700],
  ["2", "81", "11GB Gifting", 3400],
  ["2", "82", "15GB Gifting", 4250],
  ["2", "83", "40GB Gifting", 13500],

  ["2", "140", "100MB Corporate Gifting - 30 Days", 100],
  ["2", "149", "500MB Corporate Gifting - 30 Days", 248],
  ["2", "150", "1GB Corporate Gifting - 30 Days", 495],
  ["2", "151", "1.5GB Corporate Gifting - 30 Days", 743],
  ["2", "152", "2GB Corporate Gifting - 30 Days", 990],
  ["2", "153", "3GB Corporate Gifting - 30 Days", 1486],
  ["2", "154", "4.5GB Corporate Gifting - 30 Days", 2228],
  ["2", "155", "5GB Corporate Gifting - 30 Days", 2475],
  ["2", "156", "10GB Corporate Gifting - 30 Days", 4950],
  ["2", "157", "11GB Corporate Gifting - 30 Days", 5445],
  ["2", "159", "20GB Corporate Gifting - 30 Days", 9900],

  // =========================
  // GLO
  // =========================

  ["3", "41", "1.8GB Gifting - 15 Days", 465],
  ["3", "42", "2.6GB Gifting - 30 Days", 930],
  ["3", "44", "6.25GB Gifting - 30 Days", 1840],
  ["3", "46", "7.52GB Gifting - 30 Days", 2325],
  ["3", "47", "10GB Gifting - 30 Days", 2790],
  ["3", "48", "12.5GB Gifting - 30 Days", 3720],
  ["3", "49", "16.5GB Gifting - 30 Days", 4610],
  ["3", "50", "28GB Gifting - 30 Days", 7440],
  ["3", "51", "42GB Gifting - 30 Days", 9500],
  ["3", "52", "64GB Gifting - 30 Days", 13950],
  ["3", "53", "107GB Gifting - 30 Days", 18600],
  ["3", "130", "5GB Gifting - 30 Days", 1395],

  ["3", "139", "200MB Corporate Gifting - 14 Days", 120],
  ["3", "141", "1GB Corporate Gifting - 7 Days", 400],
  ["3", "142", "500MB Corporate Gifting - 30 Days", 210],
  ["3", "143", "1GB Corporate Gifting - 30 Days", 420],
  ["3", "144", "2GB Corporate Gifting - 30 Days", 840],
  ["3", "145", "3GB Corporate Gifting - 30 Days", 1260],
  ["3", "146", "5GB Corporate Gifting - 30 Days", 2100],
  ["3", "147", "10GB Corporate Gifting - 30 Days", 4200],

  ["3", "210", "750MB SME - 1 Day", 186],
  ["3", "211", "1.5GB SME - 1 Day", 279],
  ["3", "212", "2.5GB SME - 2 Days", 465],
  ["3", "213", "10GB SME - 7 Days", 1860],
  ["3", "261", "3.7GB SME - 7 Days", 950],
  ["3", "262", "9GB SME - 7 Days", 1900],
  ["3", "263", "24.5GB SME - 7 Days", 4750],
  ["3", "266", "500MB SME - 1 Day", 97],
  ["3", "267", "245MB Gifting - 1 Day", 95],
  ["3", "268", "45MB Gifting", 46],
  ["3", "269", "125MB Gifting", 93],
  ["3", "271", "3GB SME - 1 Day", 475],
  ["3", "272", "275MB Gifting - 2 Days", 186],

  // =========================
  // AIRTEL
  // =========================

  ["4", "86", "1GB Gifting - 7 Days", 784],
  ["4", "87", "2GB Gifting - 30 Days", 1470],
  ["4", "88", "4GB Gifting - 30 Days", 2450],
  ["4", "89", "3GB Gifting - 30 Days", 1960],
  ["4", "90", "8GB Gifting - 30 Days", 2940],
  ["4", "91", "10GB Gifting - 30 Days", 3920],
  ["4", "92", "13GB Gifting - 30 Days", 4900],
  ["4", "93", "18GB Gifting - 30 Days", 5880],
  ["4", "94", "25GB Gifting - 30 Days", 7840],
  ["4", "95", "35GB Gifting - 30 Days", 9800],
  ["4", "96", "60GB Gifting - 30 Days", 14700],
  ["4", "97", "500MB Gifting - 7 Days", 490],

  ["4", "131", "100MB Corporate Gifting - 7 Days", 98],
  ["4", "132", "300MB Corporate Gifting - 7 Days", 330],
  ["4", "133", "500MB Corporate Gifting - 30 Days", 495],
  ["4", "134", "1GB Corporate Gifting - 30 Days", 970],
  ["4", "135", "5GB Corporate Gifting - 30 Days", 4850],
  ["4", "136", "10GB Corporate Gifting - 30 Days", 9700],
  ["4", "161", "2GB Corporate Gifting - 30 Days", 1940],

  ["4", "197", "150MB SME - 1 Day", 70],
  ["4", "198", "300MB SME - 2 Days", 150],
  ["4", "199", "600MB SME - 3 Days", 220],
  ["4", "200", "1.5GB SME - 1 Day", 450],
  ["4", "201", "4GB SME - 7 Days", 1455],
  ["4", "202", "2GB SME - 2 Days", 582],
  ["4", "204", "10GB SME - 30 Days", 3050],

  ["4", "214", "1GB SME Social - 3 Days", 290],
  ["4", "215", "1.5GB Gifting Social - 7 Days", 485],
  ["4", "217", "6GB Gifting - 7 Days", 1940],
  ["4", "218", "500MB Gifting - 1 Day", 340],
  ["4", "219", "3GB SME - 2 Days", 776],
  ["4", "221", "1GB Gifting Social - 3 Days", 290],
  ["4", "223", "1.5GB Gifting - 7 Days", 970],
  ["4", "224", "8GB Gifting - 7 Days", 2425],
  ["4", "225", "10GB Gifting - 7 Days", 2910],
  ["4", "226", "18GB Gifting - 7 Days", 4850],
  ["4", "227", "6GB Gifting - 2 Days", 1440],
  ["4", "228", "4GB Gifting - 2 Days", 970],
  ["4", "229", "200MB Gifting - 2 Days", 197]

];

// Build final catalogue and calculate selling prices.

const PLANS = RAW_PLANS.map(
  ([networkId, id, name, cost]) => ({
    networkId,
    network: NETWORKS[networkId],
    id: String(id),
    name,
    cost,
    price: sellingPrice(cost)
  })
);

// Get every plan for a network.

function getPlans(networkId) {
  return PLANS.filter(
    plan => plan.networkId === String(networkId)
  );
}

// Get one specific plan.

function getPlan(networkId, planId) {
  return PLANS.find(
    plan =>
      plan.networkId === String(networkId) &&
      plan.id === String(planId)
  );
}

module.exports = {
  NETWORKS,
  PLANS,
  getPlans,
  getPlan
};
