const axios = require('axios');

class MonitorDolarService {
    constructor() {
        this.baseUrl = 'https://pydolarve.org';
    }

    async getRate() {
        try {
          const path = '/api/v2/dollar';
          const parameters = {
            page: "enparalelovzla",
            format_date: "default",
            rounded_price: true
          }
            const response = await axios.get(`${this.baseUrl}/${path}`, {
                params: parameters,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener tasa de Yadio:', error.message);
            throw new Error('Error al obtener tasa de Yadio');
        }
    }
}

module.exports = new MonitorDolarService();
