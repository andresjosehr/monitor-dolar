const supabase = require('../../config/supabase');

class ExchangeRates {
    /**
     * Inserta un nuevo registro de tasas de cambio
     * @param {Object} rates - Objeto con las tasas de cambio
     * @param {number} rates.binance_rate - Tasa de Binance
     * @param {number} rates.eldorado_rate - Tasa de Eldorado
     * @param {number} rates.syklo_rate - Tasa de Syklo
     * @param {number} rates.yadio_rate - Tasa de Yadio
     * @param {Date} [rates.datetime] - Fecha y hora del registro (opcional)
     * @returns {Promise<Object>} - Resultado de la inserción
     */
    static async insertRates(rates) {
        // Calcular el total_rate (promedio de todas las tasas)
        const total_rate = (
            parseFloat(rates.binance_rate) +
            parseFloat(rates.eldorado_rate) +
            parseFloat(rates.syklo_rate) +
            parseFloat(rates.yadio_rate)
        ) / 4;

        const { data, error } = await supabase
            .from('exchange_rates')
            .insert([{
                binance_rate: parseFloat(rates.binance_rate.toFixed(2)),
                eldorado_rate: parseFloat(rates.eldorado_rate.toFixed(2)),
                syklo_rate: parseFloat(rates.syklo_rate.toFixed(2)),
                yadio_rate: parseFloat(rates.yadio_rate.toFixed(2)),
                total_rate: parseFloat(total_rate.toFixed(2)),
                datetime: rates.datetime ? new Date(rates.datetime).toISOString() : new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        return data;
    }

    /**
     * Obtiene las tasas de cambio más recientes
     * @param {number} limit - Número de registros a obtener
     * @returns {Promise<Array>} - Lista de registros
     */
    static async getLatestRates(limit = 1) {
        const { data, error } = await supabase
            .from('exchange_rates')
            .select('*')
            .order('datetime', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }

    /**
     * Obtiene las tasas de cambio en un rango de fechas
     * @param {Date} startDate - Fecha de inicio
     * @param {Date} endDate - Fecha de fin
     * @returns {Promise<Array>} - Lista de registros
     */
    static async getRatesByDateRange(startDate, endDate) {
        const { data, error } = await supabase
            .from('exchange_rates')
            .select('*')
            .gte('datetime', startDate.toISOString())
            .lte('datetime', endDate.toISOString())
            .order('datetime', { ascending: true });

        if (error) throw error;
        return data;
    }
}

module.exports = ExchangeRates;
