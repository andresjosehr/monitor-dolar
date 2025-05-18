const yadioService = require('./yadio.service');
const bcvService = require('./bcv.service');
const cambiosRyaService = require('./cambiosRya.service');
const binanceService = require('./binance.service');
const eldoradoService = require('./eldorado.service');
const sykloService = require('./syklo.service');
const exchangeRates = require('../models/exchangeRates');

class ExchangeService {
    constructor() {
        this.services = {
          // bcv       : bcvService,
          // cambiosRya: cambiosRyaService,
            yadio     : yadioService,
            binance   : binanceService,
            eldorado  : eldoradoService,
            syklo     : sykloService
        };
    }

    async getAllRates() {
        const rates = {};
        const errors = {};

        for (const [name, service] of Object.entries(this.services)) {
            try {
                rates[name] = await service.getRate();
            } catch (error) {
              console.log(`Error al obtener tasa de ${name}:`, error.message);
                errors[name] = error.message;
            }
        }

        return { rates, errors };
    }

    async getAverageRate() {
        const { rates, errors } = await this.getAllRates();
        const validRates = Object.values(rates).filter(rate => rate !== null && !isNaN(rate));

        if (validRates.length === 0) {
            throw new Error('No se pudieron obtener tasas válidas');
        }

        const average = parseFloat((validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length).toFixed(2));
        return {
            average,
            rates,
            errors
        };
    }

    /**
     * Obtiene todas las tasas y las inserta en la base de datos
     * @returns {Promise<Object>} - Resultado de la inserción
     */
    async insertAllRates() {
        const { average, rates } = await this.getAverageRate();

        // Mapear los nombres de los servicios a los nombres de las columnas en la base de datos
        const mappedRates = {
            yadio_rate   : rates.yadio,
            binance_rate : rates.binance,
            eldorado_rate: rates.eldorado,
            syklo_rate   : rates.syklo,
            total_rate   : average,
            // Agregar más mapeos según sea necesario
        };

        // Insertar las tasas en la base de datos
        const result = await exchangeRates.insertRates(mappedRates);

        return {
            success: true,
            data: result,
        };
    }
}

module.exports = new ExchangeService();
