const puppeteer = require("puppeteer");
const MonitorRates = require("../models/monitorRates");
const supabase = require("../../config/supabase");

class SykloService {
  constructor() {
    this.URL_P2P =
      "https://explorer.syklo.io/widget#send_pms=VES:VE:PF,VES:VE:VEBN28,VES:VE:VEBN1,VES:VE:VEBN5,VES:VE:VEBN15&receive_pms=USDC:ALL:SYKLO&is_sending=false&local_amount=100";
    this.SELECTORS = {
      usdField: "#receive-amount-input",
      vesField: "#send-amount-input",
    };
  }

  async getRate(maxRetries = 1) {
    let retryCount = 0;

    while (retryCount < maxRetries) {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      try {
        // 1. Navegar y esperar carga completa
        await page.goto(this.URL_P2P, { waitUntil: "networkidle2" });
        await page.waitForFunction(() => document.readyState === "complete");

        // Esperar a que el selector esté disponible
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Obtener valor en VES
        const vesValue = await page.evaluate((selector) => {
          return document.querySelector(selector).value;
        }, this.SELECTORS.vesField);

        // Convertir a float
        let vesValueFloat = parseFloat(vesValue.replace(/,/g, ".")) / 100;

        // Validar valor en USD
        if (!vesValueFloat) {
          retryCount++;
          await browser.close();
          if (retryCount === maxRetries) {
            // Obtener la última tasa registrada
            const { data:lastRates, error } = await supabase
              .from("exchange_rates")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(1);

            if (lastRates && lastRates.length > 0) {
              return lastRates[0].syklo_rate;
            }
            throw new Error(
              `No se pudo obtener el valor después de ${maxRetries} intentos y no hay tasas previas disponibles`
            );
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
          // Obtener la última tasa registrada
          const { data:lastRates, error } = await supabase
            .from("exchange_rates")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1);
          if (lastRates && lastRates.length > 0) {
            return lastRates[0].syklo_rate;
          }
          throw new Error(
            `No se pudo obtener el valor después de ${maxRetries} intentos y no hay tasas previas disponibles`
          );
        }
      }
    }
  }
}

module.exports = new SykloService();
