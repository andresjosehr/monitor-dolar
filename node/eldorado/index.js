const axios = require('axios');

// Configuración por defecto para las ofertas
const DEFAULT_CONFIG = {
  type: 0,
  limit: 10,
  amount: 10000,
  amountCurrencyId: 'VES',
  cryptoCurrencyId: 'TATUM-TRON-USDT',
  fiatCurrencyId: 'VES',
  paymentMethods: ['app_pago_movil', 'bank_venezuela', 'bank_banesco', 'bank_mercantil'],
  showUserOffers: true,
  showFavoriteMMOnly: false,
  sortAsc: false
};

// URL base para las ofertas
const BASE_URL = 'https://74j6q7lg6a.execute-api.eu-west-1.amazonaws.com/stage/orderbook/public/offers/active';

// ——— FLUJO PRINCIPAL ——————————————————————————————————————————————————————————————————————
async function getOffers(config = {}) {
  // Combinar la configuración por defecto con la configuración proporcionada
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Construir los parámetros de la URL
  const params = new URLSearchParams({
    type: finalConfig.type,
    limit: finalConfig.limit,
    amount: finalConfig.amount,
    amountCurrencyId: finalConfig.amountCurrencyId,
    cryptoCurrencyId: finalConfig.cryptoCurrencyId,
    fiatCurrencyId: finalConfig.fiatCurrencyId,
    paymentMethods: finalConfig.paymentMethods.join(','),
    showUserOffers: finalConfig.showUserOffers,
    showFavoriteMMOnly: finalConfig.showFavoriteMMOnly,
    sortAsc: finalConfig.sortAsc
  });

  // Construir la URL completa
  const url = `${BASE_URL}?${params.toString()}`;

  // Realizar la petición
  const offers = await axios({
    method: "get",
    url: url,
  });

  return offers.data.data.map((offer) => {
    return {
      id: offer.offerId,
      price: offer.fiatToCryptoExchangeRate,
      usdtToSell: parseFloat((finalConfig.amount / parseFloat(offer.fiatToCryptoExchangeRate)).toFixed(2)),
      completionRate: parseFloat((offer.offerMakerStats.marketMakerSuccessRatio * 100).toFixed(2)),
      reviews: parseFloat((offer.offerMakerStats.mmScore.score * 100).toFixed(2)),
      time: (offer.offerMakerStats.payTime).toFixed(0),
      minAmount: parseFloat((offer.minLimit)).toFixed(2),
      maxAmount: parseFloat((offer.maxLimit)).toFixed(2),
    }
  });
}

async function getRate() {
  const amounts = [10, 100, 1000, 10000];
  let totalAverage = 0;
  let totalResults = 0;

  for (const amount of amounts) {
    try {
      const offers = await getOffers({ amount });

      if (offers && offers.length > 0) {
        const sum = offers.reduce((acc, offer) => acc + parseFloat(offer.price), 0);
        const average = sum / offers.length;
        totalAverage += average;
        totalResults++;
      }

      // Esperar 1 segundo antes de la siguiente solicitud
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error al obtener ofertas para monto ${amount}:`, error);
    }
  }

  return parseFloat((totalResults > 0 ? totalAverage / totalResults : 0).toFixed(2));
}

module.exports = {
  getOffers,
  getRate
};
