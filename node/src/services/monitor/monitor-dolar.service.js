const axios = require("axios");
const monitorRates = require("../models/monitorRates");
const moment = require("moment");
const dotenv = require("dotenv");
const fs = require('fs');
const path = require('path');

/**
 * Servicio para monitorear las tasas de cambio del dólar desde diferentes fuentes
 * @class MonitorDolarService
 */
class MonitorDolarService {
  /**
   * Crea una instancia del servicio MonitorDolarService
   * @constructor
   */
  constructor() {
    this.baseUrl = "https://pydolarve.org";
    this.historicalPath = "/api/v2/dollar/history";
    this.historicalBaseUrl = `${this.baseUrl}${this.historicalPath}`;
    this.pydolarToken = process.env.PYDOLAR_TOKEN;
  }

  /**
   * Obtiene las tasas de cambio del dólar desde la API de PyDolar
   * @async
   * @returns {Promise<Object>} Datos de las tasas de cambio de diferentes monitores
   * @throws {Error} Si hay un error al obtener las tasas
   */
  async getRates() {
    try {
      const path = "/api/v2/dollar";
      const parameters = {
        page: "enparalelovzla",
        format_date: "default",
        rounded_price: true,
      };
      const response = await axios.get(`${this.baseUrl}/${path}`, {
        params: parameters,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error al obtener tasa de Yadio:", error.message);
      throw new Error("Error al obtener tasa de Yadio");
    }
  }

  /**
   * Inserta las tasas de cambio en la base de datos
   * @async
   * @returns {Promise<Object|null>} Resultado de la inserción o null si ya existe un registro para la fecha
   * @throws {Error} Si hay un error al insertar las tasas
   */
  async insertRates() {
    try {
      const ratesData = await this.getRates();
      const { monitors } = ratesData;

      // Convertir la fecha del formato español a un formato que JavaScript pueda entender
      const date = monitors.airtminc.last_update.split(", ")[0]; // 16/05/2025 (dd/mm/yyyy)
      const time = monitors.airtminc.last_update.split(", ")[1]; // 12:54 PM
      const formattedDate = moment(
        `${date} ${time}`,
        "DD/MM/YYYY hh:mm A"
      ).toDate();

      // Verificar si ya existe un registro con la misma fecha
      const existingRates = await monitorRates.getRatesByDateRange(
        formattedDate,
        formattedDate
      );
      if (existingRates && existingRates.length > 0) {
        console.log("Ya existe un registro para esta fecha:", formattedDate);
        return null;
      }

      // Substract 4 hours to the date
      const dateSubstracted = moment(formattedDate).subtract(4, "hours").toDate();

      const rates = {
        airtm_rate       : monitors.airtminc.price,
        billeterap2p_rate: monitors.billeterap2p.price,
        cambiosrya_rate  : monitors.cambiosrya.price,
        eldorado_rate    : monitors.eldoradoio.price,
        mkfrontera_rate  : monitors.mkfrontera.price,
        syklo_rate       : monitors.syklo_app.price,
        usdtbnbvzla_rate : monitors.usdtbnbvzla.price,
        yadio_rate       : monitors.yadio_io.price,
        total_rate       : monitors.enparalelovzla.price,
        datetime         : dateSubstracted,
      };

      // console.log(rates);


      const result = await monitorRates.insertRates(rates);
      return result;
    } catch (error) {
      console.error("Error al insertar las tasas:", error.message);
      throw new Error("Error al insertar las tasas");
    }
  }


  async getHistoricalRates() {
    const monitors = ["enparalelovzla", "airtminc", "billeterap2p", "cambiosrya", "eldoradoio", "mkfrontera", "syklo_app", "usdtbnbvzla", "yadio_io"];
    const consolidatedHistory = {};

    for (const monitor of monitors) {
      const params = {
        page: 'enparalelovzla', // Usar el monitor actual en los parámetros
        monitor: monitor, // Usar el monitor actual en los parámetros
        start_date: "11-05-2025", // Puedes ajustar las fechas según necesites
        end_date: "21-05-2025",   // Puedes ajustar las fechas según necesites
        format_date: "default",
        rounded_price: true,
        order: "desc",
      };

      try {
        const url = `${this.historicalBaseUrl}?${new URLSearchParams(params).toString()}`;
        const response = await axios.get(url, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${this.pydolarToken}`,
          },
        });

        // Procesar los datos históricos de cada monitor
        if (response.data && response.data.history) {
          for (const entry of response.data.history) {
            // Convertir la fecha y hora a un objeto moment y luego a un string para usar como clave
            const entryMoment = moment(entry.last_update, "DD/MM/YYYY, hh:mm A");
            const dateKey = entryMoment.format("YYYY-MM-DD HH:mm"); // Clave única por fecha y hora

            if (!consolidatedHistory[dateKey]) {
              consolidatedHistory[dateKey] = {
                // datetime: entryMoment.toDate()
                // substract 4 hours to entryMoment
                datetime: entryMoment.toDate()

              };
            }

            // Mapear el nombre del monitor al nombre de la clave de tasa
            const rateKey = `${monitor}_rate`;
            consolidatedHistory[dateKey][rateKey] = entry.price;
          }
        }
      } catch (error) {
        console.error(`Error al obtener historial para ${monitor}:`, error.message);
        // Continuar con el siguiente monitor si hay un error
      }
    }

    // Convertir el objeto consolidado a un array y calcular total_rate
    const historicalRatesArray = Object.values(consolidatedHistory).map(entry => {
      // Agregar total_rate (usando enparalelovzla si está disponible, o null)
      entry.total_rate = entry.enparalelovzla_rate || null;
      return entry;
    });

    // Opcional: ordenar por fecha descendente
    historicalRatesArray.sort((a, b) => b.datetime.getTime() - a.datetime.getTime());

    // Format datetime to YYYY-MM-DD HH:mm:ss
    historicalRatesArray.forEach(entry => {
      entry.datetime = moment(entry.datetime).format("YYYY-MM-DD HH:mm:ss");
    });

    // console.log(historicalRatesArray);

    // Guardar el resultado en un archivo JSON
    const filePath = path.join(__dirname, 'rates.json');
    try {
      fs.writeFileSync(filePath, JSON.stringify(historicalRatesArray, null, 2));
      console.log(`Historial guardado en ${filePath}`);
    } catch (error) {
      console.error('Error al guardar el historial en rates.json:', error.message);
    }

    return historicalRatesArray;
  }
}

module.exports = new MonitorDolarService();
