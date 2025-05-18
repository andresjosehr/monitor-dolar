const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const supabase = require('../../config/supabase');

class BCVService {
    constructor() {
        this.baseUrl = 'https://www.bcv.org.ve/';
    }

    async getRate() {
        try {
            const response = await axios.get(this.baseUrl, {
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

            const $ = cheerio.load(response.data);
            const rateText = $("#dolar strong").text().trim();
            const rate = parseFloat(rateText.replace(",", "."));

            return rate;
        } catch (error) {
            console.error('Error al obtener tasa del BCV:', error.message);
            throw new Error('Error al obtener tasa del BCV');
        }
    }

    async getLastRate() {
        const { data, error } = await supabase.from('bcv_rates').select('bcv_rate').order('created_at', { ascending: false }).limit(1);
        if (error) {
            throw new Error('Error al obtener tasa del BCV', error);
        }
        let lastRate = 0;
        if (data.length > 0) {
            lastRate = data[0].bcv_rate;
        }
        return lastRate;
    }

    async insertBcvRate() {
        // obtener la tasa
        const rate = await this.getRate();
        console.log(rate)
        // If rate is same as last rate, return
        const lastRate = await this.getLastRate();
        if (rate === lastRate) {
            return;
        }
        // Insert rate
        const { data, error } = await supabase.from('bcv_rates').insert([{ bcv_rate: rate }]);
        if (error) {
            throw new Error('Error al insertar tasa del BCV', error);
        }
        return data;
    }
}

module.exports = new BCVService();
