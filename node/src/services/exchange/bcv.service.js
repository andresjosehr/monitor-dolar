const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

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
}

module.exports = new BCVService();
