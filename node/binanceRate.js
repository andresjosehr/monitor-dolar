const puppeteer = require("puppeteer");

// ——— SELECTORES —————————————————————————————————————————————————————————————————————————————
const URL_P2P = "https://p2p.binance.com/es";
const SELECTORS = {
  sellTab: ".bn-tab-list__segment-outline #bn-tab-1",
  currencyToggle: ".bn-textField-suffix .bn-select-field.data-single",
  currencyOptions: ".bn-select-option.icon",
  amountInput: "#C2Csearchamount_searchbox_amount",
  paymentToggle: ".bn-select-field.data-multi",
  paymentOptions: ".active.bn-select-bubble .bn-select-option",

  // Offers
  offerRows: ".bn-flex.flex-col.border-b.border-b-line.py-l",
  offerPrice: ".headline5.text-primaryText",
  offerRates: ".body3.text-tertiaryText",
  reviews: ".span.caption",
  time: ".text-tertiaryText .bn-tooltips-wrap.bn-tooltips-web .bn-tooltips-ele",
  ordersNumber: ".bn-flex.items-center .bn-flex.items-center .body3.text-tertiaryText"
};

// ——— UTILS ——————————————————————————————————————————————————————————————————————————————————
/**
 * Espera hasta que haya al menos `minCount` elementos que coincidan con `selector`.
 */
async function waitForMinimumCount(page, selector, minCount, timeout = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const count = (await page.$$(selector)).length;
    if (count >= minCount) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`Esperando ${selector} (${count}/${minCount})...`);
  }
  throw new Error(
    `Se excedió timeout esperando al menos ${minCount} elementos para ${selector}`
  );
}

/**
 * Hace click en el toggle given selector y elige la opción que matchea con `matchText`.
 */
async function selectOptionByText(
  page,
  toggleSelector,
  optionsSelector,
  matchText
) {
  await page.click(toggleSelector);
  await waitForMinimumCount(page, optionsSelector, 1);
  for (const opt of await page.$$(optionsSelector)) {
    const text = await page.evaluate((el) => el.innerText, opt);
    if (text.trim() === matchText) {
      await opt.click();
      return;
    }
  }
  throw new Error(`Opción "${matchText}" no encontrada en ${optionsSelector}`);
}

/**
 * Extrae datos de un row de oferta.
 */
async function parseOffer(row, amount) {
  // ✅ Extraer sólo el texto del nodo de precio más inmediato
  const rawPrice = await row.$eval(SELECTORS.offerPrice, (el) => {
    // Si el elemento tiene varios hijos (p. ej. etiquetas <span>),
    // solemos querer el primer nodo de texto plano:
    const firstTextNode = Array.from(el.childNodes).find(
      (n) => n.nodeType === Node.TEXT_NODE
    );
    const text = firstTextNode ? firstTextNode.textContent : el.innerText;
    return text.trim();
  });

  // Regex para quedarnos sólo con números, comas o puntos
  const priceMatch = rawPrice.match(/[\d,.]+/);
  const price = priceMatch ? priceMatch[0] : rawPrice;

  // ✅ Extraer todas las tasas y quedarnos con la segunda (índice 1)
  const rates = await row.$$eval(SELECTORS.offerRates, (els) =>
    els.map((el) => el.innerText.trim())
  );
  const completionRate = rates[1] ? rates[1].split("%")[0].trim() : "";

  // ✅ Extraer el número de reseñas
  const reviews = (await row.$eval(SELECTORS.reviews, (el) => el.innerText)).replace('%', '').trim();

  const time = (await row.$eval(SELECTORS.time, (el) => el.innerText)).match(/[\d,.]+/)[0];

  const ordersNumber = (await row.$eval(SELECTORS.ordersNumber, (el) => el.innerText)).replace(' órdenes', '').trim();

  const usdtToSell = (amount / price).toFixed(2);

  return { price, completionRate, reviews, time, ordersNumber, usdtToSell };
}

// ——— FLUJO PRINCIPAL ——————————————————————————————————————————————————————————————————————
async function getBinanceRate(amount) {
  const browser = await puppeteer.launch({ headless: false });
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

    // 5. Seleccionar método(es) de pago: Banesco o “Transferencia con banco especí...”
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
    const offers = await Promise.all(rows.map(i => parseOffer(i, amount)));

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

// Obtener argumentos de la línea de comandos
const amount = process.argv[2];

(async () => {
  if (!amount) {
    amount = 0;
  }

  const elDoradoRate = await getBinanceRate(amount);
  console.log("getElDoradoRate", elDoradoRate);
})();
