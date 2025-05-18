const yadioService = require('./yadio.service');
const bcvService = require('./bcv.service');
const cambiosRyaService = require('./cambiosRya.service');
const binanceService = require('./binance.service');
const eldoradoService = require('./eldorado.service');
const sykloService = require('./syklo.service');
const MonitorDolarService = require('./monitor-dolar.service');

class ExchangeService {
    constructor() {
        this.services = {
            yadio: yadioService,
            bcv: bcvService,
            cambiosRya: cambiosRyaService,
            binance: binanceService,
            eldorado: eldoradoService,
            syklo: sykloService
        };
    }

    async getAllRates() {
        const rates = {};
        const errors = {};

        for (const [name, service] of Object.entries(this.services)) {
            try {
                rates[name] = await service.getRate();
            } catch (error) {
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

        const average = validRates.reduce((sum, rate) => sum + rate, 0) / validRates.length;
        return {
            average,
            rates,
            errors
        };
    }
}

module.exports = new ExchangeService();
