const axios = require('axios');

class EldoradoService {
    constructor() {
        this.BASE_URL = 'https://74j6q7lg6a.execute-api.eu-west-1.amazonaws.com/stage/orderbook/public/offers/active';
        this.BASE_URL_V2 = 'https://74j6q7lg6a.execute-api.eu-west-1.amazonaws.com/stage/orderbook/public/offers/active';
        this.type = {sell: 0, buy: 1}
        this.DEFAULT_CONFIG = {
            type: this.type.buy,
            limit: 10,
            amount: 10000,
            amountCurrencyId: 'VES',
            cryptoCurrencyId: 'TATUM-TRON-USDT',
            fiatCurrencyId: 'VES',
            paymentMethods: ['app_pago_movil', 'bank_venezuela', 'bank_banesco', 'bank_mercantil'],
            showUserOffers: true,
            showFavoriteMMOnly: false,
            sortAsc: true
        };
    }

    async getOffers(config = {}) {
        try {
            const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
            const params = new URLSearchParams({
                type              : finalConfig.type,
                limit             : finalConfig.limit,
                amount            : finalConfig.amount,
                amountCurrencyId  : finalConfig.amountCurrencyId,
                cryptoCurrencyId  : finalConfig.cryptoCurrencyId,
                fiatCurrencyId    : finalConfig.fiatCurrencyId,
                paymentMethods    : finalConfig.paymentMethods.join(','),
                showUserOffers    : finalConfig.showUserOffers,
                showFavoriteMMOnly: finalConfig.showFavoriteMMOnly,
                sortAsc           : finalConfig.type === this.type.buy ? true : false
            });

            const url = `${this.BASE_URL}?${params.toString()}`;
            const response = await axios.get(url);

            return response.data.data.map((offer) => ({
                id            : offer.offerId,
                price         : offer.fiatToCryptoExchangeRate,
                usdtToSell    : parseFloat((finalConfig.amount / parseFloat(offer.fiatToCryptoExchangeRate)).toFixed(2)),
                completionRate: parseFloat((offer.offerMakerStats.marketMakerSuccessRatio * 100).toFixed(2)),
                reviews       : parseFloat((offer.offerMakerStats.mmScore.score * 100).toFixed(2)),
                time          : (offer.offerMakerStats.payTime).toFixed(0),
                minAmount     : parseFloat((offer.minLimit)).toFixed(2),
                maxAmount     : parseFloat((offer.maxLimit)).toFixed(2),
            }));
        } catch (error) {
            console.error('Error al obtener ofertas de Eldorado:', error.message);
            throw new Error('Error al obtener ofertas de Eldorado');
        }
    }

    async getRate() {
        const amounts = [100, 1000, 10000];
        let totalAverage = 0;
        let totalResults = 0;

        for (const amount of amounts) {
            try {
                const offers = await this.getOffers({ amount, type: this.type.buy });

                if (offers && offers.length > 0) {
                    const sum = offers.reduce((acc, offer) => acc + parseFloat(offer.price), 0);
                    const average = sum / offers.length;
                    totalAverage += average;
                    totalResults++;
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error al obtener ofertas para monto ${amount}:`, error);
            }
        }

        return parseFloat((totalResults > 0 ? totalAverage / totalResults : 0).toFixed(2));
    }
}

module.exports = new EldoradoService();
