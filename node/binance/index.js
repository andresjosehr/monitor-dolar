const puppeteer = require("puppeteer");
const {
  URL_P2P,
  SELECTORS,
  waitForMinimumCount,
  selectOptionByText,
  parseOffers,
} = require("./utils");
const axios = require("axios");

// ——— FLUJO PRINCIPAL ——————————————————————————————————————————————————————————————————————
async function getSalesOffersPuppeter(amount) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. Navegar y esperar carga completa
    await page.goto(URL_P2P, { waitUntil: "networkidle2" });
    await page.waitForFunction(() => document.readyState === "complete");

    // 2. Seleccionar pestaña C2C
    await page.click(SELECTORS.sellTab);

    // 3. Elegir moneda VES
    await selectOptionByText(
      page,
      SELECTORS.currencyToggle,
      SELECTORS.currencyOptions,
      "VES"
    );

    // 4. Introducir cantidad
    await page.type(SELECTORS.amountInput, amount.toString());

    // Esperar a que aparezcan al menos 3 opciones de pago
    // click en el toggle de opciones de pago
    await page.click(SELECTORS.paymentToggle);

    await waitForMinimumCount(page, SELECTORS.paymentOptions, 3);

    // 5. Seleccionar método(es) de pago: Banesco o "Transferencia con banco especí..."
    await selectOptionByText(
      page,
      SELECTORS.paymentToggle,
      SELECTORS.paymentOptions,
      "Banesco"
    );

    await selectOptionByText(
      page,
      SELECTORS.paymentToggle,
      SELECTORS.paymentOptions,
      "Transferencia Bancaria"
    );

    // Wait 1 second to let the page load
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 6. Esperar que aparezcan al menos 3 ofertas
    await waitForMinimumCount(page, SELECTORS.offerRows, 3);

    // 7. Extraer datos de cada oferta
    const rows = await page.$$(SELECTORS.offerRows);
    const offers = await Promise.all(rows.map((i) => parseOffers(i, amount)));

    // Order by usdtToSell, time, compleetionRate, reviews
    offers.sort((a, b) => {
      if (a.time !== b.time) {
        return a.time - b.time;
      }
      if (a.usdtToSell !== b.usdtToSell) {
        return a.usdtToSell - b.usdtToSell;
      }

      if (a.completionRate !== b.completionRate) {
        return a.completionRate - b.completionRate;
      }
      return a.reviews - b.reviews;
    });

    return offers;
  } finally {
    await browser.close();
  }
}

async function getOffersApi(amount, operation, payTypes = ["BANK", "Banesco", "Mercantil"]) {
  // Axcios with parameters
  const response = await axios.post(
    "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
    {
      fiat: "VES",
      page: 1,
      rows: 10,
      transAmount: amount,
      tradeType: operation, // "SELL",
      asset: "USDT",
      countries: [],
      proMerchantAds: false,
      shieldMerchantAds: false,
      filterType: "all",
      periods: [],
      additionalKycVerifyFilter: 0,
      publisherType: "merchant",
      payTypes: payTypes,
      classifies: ["mass", "profession", "fiat_trade"],
      tradedWith: false,
      followed: false,
    }
  );
  const data = response.data.data.
  filter(offer => !offer.advertiser.privilegeDesc)
  .map((offer) => {
    const adv = offer.adv;
    const advertiser = offer.advertiser;
    return {
      id: adv.advNo,
      price: adv.price,
      usdtToSell: parseFloat((amount / adv.price).toFixed(2)),
      completionRate: parseFloat((advertiser.positiveRate * 100).toFixed(2)),
      reviews: adv.tradableQuantity,
      time: adv.payTimeLimit,
      minAmount: adv.minSingleTransAmount,
      maxAmount: adv.maxSingleTransAmount,
    };
  });

  // Sort
  data.sort((a, b) => {
    if (a.time !== b.time) {
      return a.time - b.time;
    }
    if (a.usdtToSell !== b.usdtToSell) {
      return a.usdtToSell - b.usdtToSell;
    }

    if (a.completionRate !== b.completionRate) {
      return a.completionRate - b.completionRate;
    }
    return a.reviews - b.reviews;
  });

  return data;
}

async function getRate() {
  const amounts = [10, 100, 1000, 10000];
  let totalAverage = 0;
  let totalResults = 0;

  for (const amount of amounts) {
    try {
      const offers = await getOffersApi(amount, "SELL");

      if (offers && offers.length > 0) {
        const sum = offers.reduce((acc, offer) => acc + parseFloat(offer.price), 0);
        const average = sum / offers.length;
        totalAverage += average;
        totalResults++;
      }

      // Esperar 1 segundo antes de la siguiente solicitud
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error al obtener ofertas para monto ${amount}:`, error);
    }
  }

  return parseFloat((totalResults > 0 ? totalAverage / totalResults : 0).toFixed(2));
}

// Obtener argumentos de la línea de comandos
const amount = process.argv[2];

module.exports = {
  getOffersApi,
  getRate,
};
