// src/app/services/binance.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export interface Offer {
  id: string;
  price: number;
  usdtToSell: number;
  completionRate: number;
  reviews: number;
  time: number;
  minAmount: number;
  maxAmount: number;
}

interface BinanceApiResponse {
  data: Array<{
    adv: {
      advNo: string;
      price: string;
      tradableQuantity: number;
      payTimeLimit: number;
      minSingleTransAmount: number;
      maxSingleTransAmount: number;
    };
    advertiser: {
      positiveRate: number;
      privilegeDesc?: string;
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class BinanceService {
  private readonly API_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las ofertas de Binance P2P para un monto dado.
   * @param amount Monto de VES que quieres intercambiar.
   * @param operation 'SELL' o 'BUY'.
   * @param payTypes Métodos de pago a filtrar.
   */
  async getOffersApi(
    amount: number | string,
    operation: 'SELL' | 'BUY' = 'SELL',
    payTypes: string[] = ['BANK', 'Banesco', 'Mercantil']
  ): Promise<Offer[]> {
    const proxy = 'https://cors.bridged.cc/';
    const url = proxy + this.API_URL;
    const payload = {
      fiat: 'VES',
      page: 1,
      rows: 10,
      transAmount: amount,
      tradeType: operation,
      asset: 'USDT',
      countries: [],
      proMerchantAds: false,
      shieldMerchantAds: false,
      filterType: 'all',
      periods: [],
      additionalKycVerifyFilter: 0,
      publisherType: 'merchant',
      payTypes,
      classifies: ['mass', 'profession', 'fiat_trade'],
      tradedWith: false,
      followed: false,
    };

    try {
      const resp = await lastValueFrom(
        this.http.post<BinanceApiResponse>(url, payload)
      );
      return resp.data
        .filter(item => !item.advertiser.privilegeDesc)
        .map(item => {
          const adv = item.adv;
          const advertiser = item.advertiser;
          const priceNum = parseFloat(adv.price);
          return {
            id: adv.advNo,
            price: priceNum,
            usdtToSell: parseFloat((Number(amount) / priceNum).toFixed(2)),
            completionRate: parseFloat((advertiser.positiveRate * 100).toFixed(2)),
            reviews: adv.tradableQuantity,
            time: adv.payTimeLimit,
            minAmount: adv.minSingleTransAmount,
            maxAmount: adv.maxSingleTransAmount,
          };
        });
    } catch (err) {
      console.error('Error al obtener ofertas de Binance:', (err as HttpErrorResponse).message);
      throw new Error('Error al obtener ofertas de Binance');
    }
  }

  /**
   * Calcula el precio promedio de venta consultando varios montos.
   */
  async getRate(): Promise<number> {
    const amounts = [10, 100, 1000, 10000];
    let totalAverage = 0;
    let count = 0;

    for (const amt of amounts) {
      try {
        const offers = await this.getOffersApi(amt, 'SELL');
        if (offers.length) {
          const sumPrices = offers.reduce((sum, o) => sum + o.price, 0);
          const avg = sumPrices / offers.length;
          totalAverage += avg;
          count++;
        }
        // Pausa de 1 s para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(`Error obteniendo ofertas para ${amt}:`, (e as Error).message);
      }
    }

    const result = count > 0 ? totalAverage / count : 0;
    return parseFloat(result.toFixed(2));
  }
}
