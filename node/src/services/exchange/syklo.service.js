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

  async getLastRate() {
    const { data: lastRates, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!lastRates || lastRates.length === 0) {
      throw new Error("No hay tasas previas disponibles");
    }

    return lastRates[0].syklo_rate;
  }

  async scrapeRate() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    try {
      await page.goto(this.URL_P2P, { waitUntil: "networkidle2" });
      await page.waitForFunction(() => document.readyState === "complete");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const vesValue = await page.evaluate((selector) => {
        return document.querySelector(selector).value;
      }, this.SELECTORS.vesField);

      const vesValueFloat = parseFloat(vesValue.replace(/,/g, ".")) / 100;

      if (!vesValueFloat) {
        throw new Error("No se pudo obtener un valor válido");
      }

      return parseFloat(vesValueFloat.toFixed(2));
    } finally {
      await browser.close();
    }
  }

  async getRate(maxRetries = 3) {
    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
      try {
        return await this.scrapeRate();
      } catch (error) {
        // console.error(`Error en intento ${retryCount + 1}:`, error);

        if (retryCount === maxRetries - 1) {
          return await this.getLastRate();
        }
      }
    }
  }
}

module.exports = new SykloService();
