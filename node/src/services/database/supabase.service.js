const supabase = require('../../config/supabase');

class SupabaseService {
    constructor() {
        this.tableName = 'exchange_rates';
    }

    async saveRate(rate, source) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .insert([
                    {
                        rate,
                        source,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al guardar tasa en Supabase:', error.message);
            throw new Error('Error al guardar tasa en Supabase');
        }
    }

    async getLatestRates(limit = 10) {
        try {
            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener tasas de Supabase:', error.message);
            throw new Error('Error al obtener tasas de Supabase');
        }
    }
}

module.exports = new SupabaseService();
