const supabase = require('../../config/supabase');

class MonitorRates {
    /**
     * Inserta un nuevo registro de tasas de cambio
     * @param {Object} rates - Objeto con las tasas de cambio
     * @param {number} rates.airtm_rate - Tasa de Airtm
     * @param {number} rates.billeterap2p_rate - Tasa de BilleteraP2P
     * @param {number} rates.cambiosrya_rate - Tasa de CambiosRya
     * @param {number} rates.eldorado_rate - Tasa de Eldorado
     * @param {number} rates.mkfrontera_rate - Tasa de MKFrontera
     * @param {number} rates.syklo_rate - Tasa de Syklo
     * @param {number} rates.usdtbnbvzla_rate - Tasa de USDTBNBVzla
     * @param {number} rates.yadio_rate - Tasa de Yadio
     * @param {Date} [rates.datetime] - Fecha y hora del registro (opcional)
     * @returns {Promise<Object>} - Resultado de la inserción
     */
    static async insertRates(rates) {
        // Calcular el total_rate (promedio de todas las tasas)
        const total_rate = (
            parseFloat(rates.airtm_rate) +
            parseFloat(rates.billeterap2p_rate) +
            parseFloat(rates.cambiosrya_rate) +
            parseFloat(rates.eldorado_rate) +
            parseFloat(rates.mkfrontera_rate) +
            parseFloat(rates.syklo_rate) +
            parseFloat(rates.usdtbnbvzla_rate) +
            parseFloat(rates.yadio_rate)
        ) / 8;

        const { data, error } = await supabase
            .from('monitor_rates')
            .insert([{
                airtm_rate       : parseFloat(rates.airtm_rate.toFixed(2)),
                billeterap2p_rate: parseFloat(rates.billeterap2p_rate.toFixed(2)),
                cambiosrya_rate  : parseFloat(rates.cambiosrya_rate.toFixed(2)),
                eldorado_rate    : parseFloat(rates.eldorado_rate.toFixed(2)),
                mkfrontera_rate  : parseFloat(rates.mkfrontera_rate.toFixed(2)),
                syklo_rate       : parseFloat(rates.syklo_rate.toFixed(2)),
                usdtbnbvzla_rate : parseFloat(rates.usdtbnbvzla_rate.toFixed(2)),
                yadio_rate       : parseFloat(rates.yadio_rate.toFixed(2)),
                total_rate       : parseFloat(total_rate.toFixed(2)),
                datetime         : rates.datetime ? new Date(rates.datetime).toISOString(): new Date().toISOString()
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
            .from('monitor_rates')
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
            .from('monitor_rates')
            .select('*')
            .gte('datetime', startDate.toISOString())
            .lte('datetime', endDate.toISOString())
            .order('datetime', { ascending: true });

        if (error) throw error;
        return data;
    }
}

module.exports = MonitorRates;
