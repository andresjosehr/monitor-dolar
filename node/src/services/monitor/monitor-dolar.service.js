const axios = require("axios");
const monitorRates = require("../models/monitorRates");
const moment = require("moment");

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
        datetime         : formattedDate,
      };


      const result = await monitorRates.insertRates(rates);
      return result;
    } catch (error) {
      console.error("Error al insertar las tasas:", error.message);
      throw new Error("Error al insertar las tasas");
    }
  }
}

module.exports = new MonitorDolarService();
