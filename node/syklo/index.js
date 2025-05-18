const puppeteer = require("puppeteer");

// Utils

const URL_P2P =
  "https://explorer.syklo.io/widget#send_pms=VES:VE:PF,VES:VE:VEBN28,VES:VE:VEBN1,VES:VE:VEBN5,VES:VE:VEBN15&receive_pms=USD:ALL:ZI,USD:ALL:WTE&is_sending=false&local_amount=100";
const SELECTORS = {
  usdField: "#receive-amount-input",
  vesField: "#send-amount-input",
};

// ——— FLUJO PRINCIPAL ——————————————————————————————————————————————————————————————————————
async function getRate(maxRetries = 3) {
  let retryCount = 0;

  while (retryCount < maxRetries) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      // 1. Navegar y esperar carga completa
      await page.goto(URL_P2P, { waitUntil: "networkidle2" });
      await page.waitForFunction(() => document.readyState === "complete");

      // Await for selector to be available
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Get value in VES
      const vesValue = await page.evaluate((selector) => {
        return document.querySelector(selector).value;
      }, SELECTORS.vesField);

      // convert to float
      let vesValueFloat = parseFloat(vesValue.replace(/,/g, ".")) / 100;

      // Get value in USD
      if (!vesValueFloat) {
        retryCount++;
        await browser.close();
        if (retryCount === maxRetries) {
          console.log(`No se pudo obtener el valor después de ${maxRetries} intentos`);
          return null;
        }
        continue;
      }

      vesValueFloat = parseFloat(vesValueFloat.toFixed(2));
      await browser.close();
      return vesValueFloat;

    } catch (error) {
      console.error(`Error en intento ${retryCount + 1}:`, error);
      await browser.close();
      retryCount++;

      if (retryCount === maxRetries) {
        console.log(`No se pudo obtener el valor después de ${maxRetries} intentos`);
        return null;
      }
    }
  }
}

module.exports = {
  getRate,
};
