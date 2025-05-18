// Import
const { getBCVRate } = require("./index");
const binance = require("./binance");
const eldorado = require("./eldorado");
const { program } = require("commander");
const syklo = require("./syklo");
const axios = require("axios");

program
  .command("bcvToBinance <usd-bcv-amount>") // Define el comando 'saludar' que requiere un argumento '<nombre>'
  .description(
    "Hace el calculo de cuanto dolares en binance equivalen a la cantidad de dolares en bcv"
  )
  .action(async (usdAmount) => {
    try {
      const bcvRate = await getBCVRate();
      const vesAmount = (parseFloat(usdAmount) * bcvRate).toFixed(2);
      const salesOffers = await binance.getOffersApi(vesAmount, "SELL");

      if (!salesOffers) {
        console.log("No hay ofertas disponibles");
        return;
      }
      const offer = salesOffers[0];
      if (!offer) {
        console.log("No hay ofertas disponibles");
        return;
      }

      console.log(offer.usdtToSell);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program
  .command("bcvToEldorado <usd-bcv-amount>") // Define el comando 'saludar' que requiere un argumento '<nombre>'
  .description("Obtiene información de ofertas en el dorado")
  .action(async (usdAmount) => {
    try {
      const bcvRate = await getBCVRate();
      const vesAmount = (parseFloat(usdAmount) * bcvRate).toFixed(2);

      const salesOffers = await eldorado.getOffers({ amount: vesAmount });
      if (!salesOffers) {
        console.log("No hay ofertas disponibles");
        return;
      }
      const offer = salesOffers[0];
      if (!offer) {
        console.log("No hay ofertas disponibles");
        return;
      }

      console.log(offer.usdtToSell);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program
  .command("sykloRate") // Define el comando 'saludar' que requiere un argumento '<nombre>'
  .description("Obtiene información de tasa de syklo")
  .action(async () => {
    try {
      const sykloRate = await syklo.getRate();
      console.log(sykloRate);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program
  .command("yadioRate") // Define el comando 'saludar' que requiere un argumento '<nombre>'
  .description("Obtiene información de tasa de syklo")
  .action(async () => {
    try {
      const response = await axios.get("https://api.yadio.io/exrates/USD");
      const rate = response.data.USD.VES;
      console.log(rate);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program
  .command("binanceRate") // Define el comando 'saludar' que requiere un argumento '<nombre>'
  .description("Obtiene información de tasa de binance")
  .action(async () => {
    try {
      const rate = await binance.getRate();
      console.log(rate);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program
  .command("eldoradoRate") // Define el comando 'saludar' que requiere un argumento '<nombre>'
  .description("Obtiene información de tasa de eldorado")
  .action(async () => {
    try {
      const rate = await eldorado.getRate();
      console.log(rate);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program.parse(process.argv);
