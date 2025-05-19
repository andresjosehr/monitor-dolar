const axios = require("axios");

class BinanceService {
    async getOffersApi(amount, operation = "SELL", payTypes = ["BANK", "Banesco", "Mercantil"]) {
        try {
            const response = await axios.post(
                "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
                {
                    fiat: "VES",
                    page: 1,
                    rows: 10,
                    transAmount: amount,
                    tradeType: operation,
                    asset: "USDT",
                    countries: [],
                    proMerchantAds: false,
                    shieldMerchantAds: false,
                    filterType: "all",
                    periods: [],
                    additionalKycVerifyFilter: 0,
                    publisherType: "merchant",
                    payTypes: payTypes,
                    classifies: ["mass", "profession", "fiat_trade"],
                    tradedWith: false,
                    followed: false,
                }
            );

            return response.data.data
                .filter(offer => !offer.advertiser.privilegeDesc)
                .map((offer) => {
                    const adv = offer.adv;
                    const advertiser = offer.advertiser;
                    return {
                        id: adv.advNo,
                        price: adv.price,
                        usdtToSell: parseFloat((amount / adv.price).toFixed(2)),
                        completionRate: parseFloat((advertiser.positiveRate * 100).toFixed(2)),
                        reviews: adv.tradableQuantity,
                        time: adv.payTimeLimit,
                        minAmount: adv.minSingleTransAmount,
                        maxAmount: adv.maxSingleTransAmount,
                    };
                });
        } catch (error) {
            console.error('Error al obtener ofertas de Binance:', error.message);
            throw new Error('Error al obtener ofertas de Binance');
        }
    }

    async getRate() {
        const amounts = [100, 1000, 10000];
        let totalAverage = 0;
        let totalResults = 0;

        for (const amount of amounts) {
            try {
                const offers = await this.getOffersApi(amount, "BUY");

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

module.exports = new BinanceService();
