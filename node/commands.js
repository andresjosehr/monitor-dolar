const { getBCVRate }      = require("./index");
const { program }         = require("commander");
const exchangeService     = require("./src/services/exchange");
const binanceService      = require("./src/services/exchange/binance.service");
const eldoradoService     = require("./src/services/exchange/eldorado.service");
const bcvService          = require("./src/services/exchange/bcv.service");
const yadioService        = require("./src/services/exchange/yadio.service");
const sykloService        = require("./src/services/exchange/syklo.service");
const monitorDolarService = require("./src/services/monitor/monitor-dolar.service");

program
  .command("bcvToBinance <usd-bcv-amount>")
  .description("Convierte una cantidad de USD (según tasa BCV) a su equivalente en Binance. Calcula primero el valor en VES usando la tasa BCV y luego busca la mejor oferta de venta en Binance.")
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
  .description("Convierte una cantidad de USD (según tasa BCV) a su equivalente en El Dorado. Calcula primero el valor en VES usando la tasa BCV y luego busca la mejor oferta de venta en El Dorado.")
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
  .description("Obtiene la tasa de cambio actual de Syklo. Muestra el valor de compra y venta de USD en VES según las cotizaciones de Syklo.")
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
  .description("Obtiene la tasa de cambio actual de Yadio. Muestra el valor de compra y venta de USD en VES según las cotizaciones de Yadio.")
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
  .description("Obtiene la tasa de cambio actual de Binance. Muestra el valor de compra y venta de USDT en VES según las ofertas disponibles en Binance P2P.")
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
  .description("Obtiene la tasa de cambio actual de El Dorado. Muestra el valor de compra y venta de USD en VES según las cotizaciones de El Dorado.")
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
  .description("Obtiene y muestra todas las tasas disponibles de todos los servicios configurados. Incluye tasas de BCV, Binance, El Dorado, Yadio, Syklo y Monitor Dolar.")
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
  .description("Calcula y muestra el promedio de todas las tasas disponibles. También muestra las tasas individuales y cualquier error que haya ocurrido al obtener las tasas.")
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
  .description("Obtiene la tasa de cambio actual de Monitor Dolar. Muestra el valor de compra y venta de USD en VES según las cotizaciones de Monitor Dolar.")
  .action(async () => {
    try {
      const rates = await monitorDolarService.getRates();
      console.log(rates);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });



  program
  .command("saveMonitorRates")
  .description("")
  .action(async () => {
    try {
      const rates = await monitorDolarService.insertRates();
      console.log('Tasas guardadas');
    } catch (error) {
      console.error("Error:", error.message);
    }
  });




  program
  .command("saveExchangesRates")
  .description("")
  .action(async () => {
    try {
      const rates = await exchangeService.insertAllRates();
      console.log('Tasas guardadas');
    } catch (error) {
      console.error("Error:", error.message);
    }
  });



  program
  .command("insertBcvRate")
  .description("")
  .action(async () => {
    try {
      const rates = await bcvService.insertBcvRate();
      console.log('Tasa BCV guardada');
    } catch (error) {
      console.error("Error:", error.message);
    }
  });







program.parse(process.argv);
