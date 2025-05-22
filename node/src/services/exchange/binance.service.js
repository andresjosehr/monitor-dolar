const axios = require("axios");
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class BinanceService {
    constructor() {
        this.DEFAULT_CONFIG = {
            fiat: "VES",
            page: 1,
            rows: 10,
            amount: 1000,
            operation: "SELL",
            asset: "USDT",
            payTypes: ["BANK", "Banesco", "Mercantil"],
            exchangeRatesId: null
        };
    }

    async getOffersApi(config = {}) {
        try {
            const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

            const response = await axios.post(
                "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search",
                {
                    fiat: finalConfig.fiat,
                    page: finalConfig.page,
                    rows: finalConfig.rows,
                    transAmount: finalConfig.amount,
                    tradeType: finalConfig.operation,
                    asset: finalConfig.asset,
                    countries: [],
                    proMerchantAds: false,
                    shieldMerchantAds: false,
                    filterType: "all",
                    periods: [],
                    additionalKycVerifyFilter: 0,
                    publisherType: "merchant",
                    payTypes: finalConfig.payTypes,
                    classifies: ["mass", "profession", "fiat_trade"],
                    tradedWith: false,
                    followed: false,
                }
            );

            const offers = response.data.data
                .filter(offer => !offer.advertiser.privilegeDesc)
                .map((offer) => {
                    const adv = offer.adv;
                    const advertiser = offer.advertiser;
                    return {
                        id            : adv.advNo,
                        price         : adv.price,
                        usdtToSell    : parseFloat((finalConfig.amount / adv.price).toFixed(2)),
                        completionRate: parseFloat((advertiser.positiveRate * 100).toFixed(2)),
                        reviews       : adv.tradableQuantity,
                        time          : adv.payTimeLimit,
                        operation     : finalConfig.operation,
                        minAmount     : adv.minSingleTransAmount,
                        maxAmount     : adv.maxSingleTransAmount,
                    };
                });

            if (finalConfig.exchangeRatesId) {
                await this.insertOffers(offers, finalConfig.exchangeRatesId);
            }

            return offers;
        } catch (error) {
            console.error('Error al obtener ofertas de Binance:', error.message);
            throw new Error('Error al obtener ofertas de Binance');
        }
    }

    async insertOffers(offers, exchangeRatesId = null) {
        try {
            const dataToInsert = offers.map(offer => ({
                binance_id: offer.id.toString(),
                price: offer.price,
                usdt_to_sell: offer.usdtToSell,
                completion_rate: offer.completionRate,
                tradable_quantity: offer.reviews,
                pay_time_limit: offer.time,
                operation: offer.operation,
                min_amount: offer.minAmount,
                max_amount: offer.maxAmount,
                exchange_rates_id: exchangeRatesId,
            }));

            const { data, error } = await supabase
                .from('binance_orders')
                .insert(dataToInsert);

            if (error) {
                console.error('Error al insertar ofertas en Supabase:', error);
                throw error;
            }

            console.log(`Se insertaron ${dataToInsert.length} ofertas en la base de datos`);
            return data;
        } catch (error) {
            console.error('Error en insertOffers:', error);
            throw new Error('No se pudieron insertar las ofertas en la base de datos');
        }
    }

    async getRate() {
        const amounts = [100, 1000, 10000];
        let totalAverage = 0;
        let totalResults = 0;
        let allOffers = [];

        for (const amount of amounts) {
            try {
                const offers = await this.getOffersApi({
                    amount,
                    operation: "BUY",
                    payTypes: ["BANK", "Banesco", "Mercantil"]
                });

                if (offers && offers.length > 0) {
                    allOffers = [...allOffers, ...offers];
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

        return {
            rate: parseFloat((totalResults > 0 ? totalAverage / totalResults : 0).toFixed(2)),
            offers: allOffers
        };
    }
}

module.exports = new BinanceService();
