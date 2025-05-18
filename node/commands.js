// Import
const { getBCVRate } = require("./index");
const { program } = require("commander");
const exchangeService = require("./src/services/exchange");
const binanceService = require("./src/services/exchange/binance.service");
const eldoradoService = require("./src/services/exchange/eldorado.service");
const bcvService = require("./src/services/exchange/bcv.service");
const yadioService = require("./src/services/exchange/yadio.service");
const sykloService = require("./src/services/exchange/syklo.service");
const monitorDolarService = require("./src/services/exchange/monitor-dolar.service");

program
  .command("bcvToBinance <usd-bcv-amount>")
  .description("Hace el calculo de cuanto dolares en binance equivalen a la cantidad de dolares en bcv")
  .action(async (usdAmount) => {
    try {
      const bcvRate = await bcvService.getRate();
      const vesAmount = (parseFloat(usdAmount) * bcvRate).toFixed(2);
      const salesOffers = await binanceService.getOffersApi(vesAmount, "SELL");

      if (!salesOffers || salesOffers.length === 0) {
        console.log("No hay ofertas disponibles");
        return;
      }

      const offer = salesOffers[0];
      console.log(offer.usdtToSell);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program
  .command("bcvToEldorado <usd-bcv-amount>")
  .description("Obtiene información de ofertas en el dorado")
  .action(async (usdAmount) => {
    try {
      const bcvRate = await bcvService.getRate();
      const vesAmount = (parseFloat(usdAmount) * bcvRate).toFixed(2);

      const salesOffers = await eldoradoService.getOffers({ amount: vesAmount });
      if (!salesOffers || salesOffers.length === 0) {
        console.log("No hay ofertas disponibles");
        return;
      }

      const offer = salesOffers[0];
      console.log(offer.usdtToSell);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program
  .command("sykloRate")
  .description("Obtiene información de tasa de syklo")
  .action(async () => {
    try {
      const rate = await sykloService.getRate();
      console.log(rate);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program
  .command("yadioRate")
  .description("Obtiene información de tasa de yadio")
  .action(async () => {
    try {
      const rate = await yadioService.getRate();
      console.log(rate);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program
  .command("binanceRate")
  .description("Obtiene información de tasa de binance")
  .action(async () => {
    try {
      const rate = await binanceService.getRate();
      console.log(rate);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program
  .command("eldoradoRate")
  .description("Obtiene información de tasa de eldorado")
  .action(async () => {
    try {
      const rate = await eldoradoService.getRate();
      console.log(rate);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program
  .command("allRates")
  .description("Obtiene todas las tasas disponibles")
  .action(async () => {
    try {
      const { rates, errors } = await exchangeService.getAllRates();
      console.log("Tasas obtenidas:", rates);
      if (Object.keys(errors).length > 0) {
        console.log("Errores:", errors);
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

  program
  .command("averageRate")
  .description("Obtiene el promedio de todas las tasas disponibles")
  .action(async () => {
    try {
      const { average, rates, errors } = await exchangeService.getAverageRate();
      console.log("Promedio:", average);
      console.log("Tasas individuales:", rates);
      if (Object.keys(errors).length > 0) {
        console.log("Errores:", errors);
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  });



  program
  .command("monitorDolarRate")
  .description("Obtiene el promedio de todas las tasas disponibles")
  .action(async () => {
    try {
      const rates = await monitorDolarService.getRate();
      console.log(rates);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

program.parse(process.argv);
