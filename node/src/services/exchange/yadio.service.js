const axios = require('axios');

class YadioService {
    constructor() {
        this.baseUrl = 'https://api.yadio.io/exrates/USD';
    }

    async getRate() {
        try {
            const response = await axios.get(this.baseUrl);
            return response.data.USD.VES;
        } catch (error) {
            console.error('Error al obtener tasa de Yadio:', error.message);
            throw new Error('Error al obtener tasa de Yadio');
        }
    }
}

module.exports = new YadioService();
