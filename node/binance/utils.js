// ——— SELECTORES —————————————————————————————————————————————————————————————————————————————
const URL_P2P = "https://p2p.binance.com/es";
const SELECTORS = {

  // Filters
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
    // console.log(`Esperando ${selector} (${count}/${minCount})...`);
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
async function parseOffers(row, amount) {
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

module.exports = {
  URL_P2P,
  SELECTORS,
  waitForMinimumCount,
  selectOptionByText,
  parseOffers
};
