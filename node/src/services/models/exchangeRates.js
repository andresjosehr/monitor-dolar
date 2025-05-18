const supabase = require('../../config/supabase');

class ExchangeRates {
    /**
     * Inserta un nuevo registro de tasas de cambio
     * @param {Object} rates - Objeto con las tasas de cambio
     * @param {number} rates.binance_rate - Tasa de Binance
     * @param {number} rates.eldorado_rate - Tasa de Eldorado
     * @param {number} rates.syklo_rate - Tasa de Syklo
     * @param {number} rates.yadio_rate - Tasa de Yadio
     * @returns {Promise<Object>} - Resultado de la inserción
     */
    static async insertRates(rates) {

        const { data, error } = await supabase
            .from('exchange_rates')
            .insert([{
                binance_rate : parseFloat(rates.binance_rate),
                eldorado_rate: parseFloat(rates.eldorado_rate),
                syklo_rate   : parseFloat(rates.syklo_rate),
                yadio_rate   : parseFloat(rates.yadio_rate),
                total_rate   : parseFloat(rates.total_rate),
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
            .order('created_at', { ascending: false })
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
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    }
}

module.exports = ExchangeRates;
