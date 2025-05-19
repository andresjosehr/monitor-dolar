import { Component, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { Database } from '../../core/interfaces/supabase.types';
import { DatePipe, DecimalPipe } from '@angular/common';
import moment from 'moment';
import 'moment/locale/es';
import { PriceChartComponent } from '../../chart/price-chart/price-chart.component';
import { CurrencyCalculatorComponent } from '../../components/currency-calculator/currency-calculator.component';
import { PwaPromptComponent } from '../../components/pwa-prompt/pwa-prompt.component';
import { MatTabsModule } from '@angular/material/tabs';

type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row'];
type MonitorRate = Database['public']['Tables']['monitor_rates']['Row'];
type BcvRate = Database['public']['Tables']['bcv_rates']['Row'];

interface CombinedRate {
  exchange: string;
  exchange_rate: number;
  monitor_rate: number;
  diferencia: number;
  diferencia_porcentaje: number;
  last_update_monitor: moment.Moment;
  last_update_exchange: moment.Moment;
  tiempo_diferencia: string;
}

interface ExchangeRateComparison {
  exchange: string;
  current_rate: number;
  previous_rate: number;
  diferencia: number;
  diferencia_porcentaje: number;
  last_update: moment.Moment;
  previous_update: moment.Moment;
}

interface MonitorRateComparison {
  exchange: string;
  current_rate: number;
  previous_rate: number;
  diferencia: number;
  diferencia_porcentaje: number;
  last_update: moment.Moment;
  previous_update: moment.Moment;
}

interface BcvRateComparison {
  date: moment.Moment;
  rate: number;
  diferencia: number;
  diferencia_porcentaje: number;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  templateUrl: './inicio.component.html',
  imports: [
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
    DatePipe,
    DecimalPipe,
    PriceChartComponent,
    CurrencyCalculatorComponent,
    PwaPromptComponent,
    MatTabsModule
  ],
  styles: [
    `
    .mdc-data-table__cell, .mdc-data-table__header-cell {
          padding: 0 7px;
      }
    .spinner-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }
    ::ng-deep .mat-mdc-tab-group.mat-mdc-tab-group-stretch-tabs>.mat-mdc-tab-header .mat-mdc-tab {
      height: 20px;
    }
    `
  ]
})
export class InicioComponent implements OnInit {
  exchangeRates: ExchangeRate[] = [];
  monitorRates: MonitorRate[] = [];
  bcvRates: BcvRate[] = [];
  combinedRates: CombinedRate[] = [];
  combinedRates2: CombinedRate[] = [];
  exchangeComparisons: ExchangeRateComparison[] = [];
  monitorComparisons: MonitorRateComparison[] = [];
  bcvComparisons: BcvRateComparison[] = [];

  displayedColumns: string[] = ['exchange', 'monitor_rate', 'exchange_rate', 'diferencia'];
  exchangeColumns: string[] = ['exchange', 'previous_rate', 'current_rate', 'diferencia'];
  monitorColumns: string[] = ['exchange', 'previous_rate', 'current_rate', 'diferencia'];
  bcvColumns: string[] = ['date', 'rate', 'diferencia'];

  // Loading states
  loadingComparison = true;
  loadingComparison2 = true;
  loadingMonitor = true;
  loadingExchange = true;
  loadingBcv = true;

  constructor(private supabaseService: SupabaseService) {
    moment.locale('es');
  }

  async ngOnInit() {
    await this.loadMonitorRates();
    await this.loadExchangeRates();
    await this.loadBcvRates();
    this.combineRates();
    this.processExchangeRates();
    this.processMonitorRates();
    this.processBcvRates();
  }

  async loadExchangeRates() {
    this.loadingExchange = true;
    if (this.monitorRates.length === 0) {
      console.error('No hay monitor rates disponibles');
      return;
    }

    const lastMonitorDate = this.monitorRates[0].datetime;

    // Obtenemos el último registro y el registro más cercano a la fecha del monitor
    const { data: latestData, error: latestError } = await this.supabaseService.getClient()
      .from('exchange_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (latestError) {
      console.error('Error cargando último exchange rate:', latestError);
      return;
    }

    const { data: closestData, error: closestError } = await this.supabaseService.getClient()
      .from('exchange_rates')
      .select('*')
      .lte('created_at', lastMonitorDate)
      .order('created_at', { ascending: false })
      .limit(1);

    if (closestError) {
      console.error('Error cargando exchange rate cercano:', closestError);
      return;
    }
    // Combinamos los resultados, evitando duplicados si el más reciente es tmbién el más cercano
    this.exchangeRates = latestData && closestData ?
      latestData[0].created_at === closestData[0].created_at ?
        latestData :
        [...latestData, ...closestData] :
      [];
    this.loadingExchange = false;
  }

  async loadMonitorRates() {
    this.loadingMonitor = true;
    const { data, error } = await this.supabaseService.getClient()
      .from('monitor_rates')
      .select('*')
      .order('datetime', { ascending: false })
      .limit(2);

    if (error) {
      console.error('Error cargando monitor rates:', error);
      return;
    }

    this.monitorRates = data || [];
    this.loadingMonitor = false;
  }

  async loadBcvRates() {
    this.loadingBcv = true;
    const { data, error } = await this.supabaseService.getClient()
      .from('bcv_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error cargando bcv rates:', error);
      return;
    }

    this.bcvRates = data || [];
    this.loadingBcv = false;
  }

  private calculateDifference(current: number, previous: number) {
    const diff = Number((current - previous).toFixed(2));
    const percentage = previous !== 0 ? Number(((diff / previous) * 100).toFixed(2)) : 0;
    return {
      diferencia: diff,
      diferencia_porcentaje: percentage
    };
  }

  private processExchangeRates() {
    if (this.exchangeRates.length < 2) return;

    const current = this.exchangeRates[0];
    const previous = this.exchangeRates[1];
    const currentMoment = moment(current.created_at);
    const previousMoment = moment(previous.created_at);

    const processRate = (currentRate: number, previousRate: number, exchangeName: string) => ({
      exchange: exchangeName,
      current_rate: currentRate || 0,
      previous_rate: previousRate || 0,
      ...this.calculateDifference(currentRate || 0, previousRate || 0),
      last_update: currentMoment,
      previous_update: previousMoment
    });

    this.exchangeComparisons = [
      processRate(current.total_rate, previous.total_rate, 'Total'),
      processRate(current.binance_rate, previous.binance_rate, 'Binance'),
      processRate(current.eldorado_rate, previous.eldorado_rate, 'Eldorado'),
      processRate(current.syklo_rate, previous.syklo_rate, 'Syklo'),
      processRate(current.yadio_rate, previous.yadio_rate, 'Yadio'),
    ];

  }

  private processMonitorRates() {
    if (this.monitorRates.length < 2) return;

    const current = this.monitorRates[0];
    const previous = this.monitorRates[1];
    const currentMoment = moment(current.datetime);
    const previousMoment = moment(previous.datetime);

    const processRate = (currentRate: number, previousRate: number, exchangeName: string) => ({
      exchange: exchangeName,
      current_rate: currentRate || 0,
      previous_rate: previousRate || 0,
      ...this.calculateDifference(currentRate || 0, previousRate || 0),
      last_update: currentMoment,
      previous_update: previousMoment
    });

    this.monitorComparisons = [

      processRate(current.total_rate, previous.total_rate, 'Total'),
      processRate(current.yadio_rate, previous.yadio_rate, 'Yadio'),
      processRate(current.cambiosrya_rate, previous.cambiosrya_rate, 'CambiosRya'),
      processRate(current.airtm_rate, previous.airtm_rate, 'Airtm'),
      processRate(current.usdtbnbvzla_rate, previous.usdtbnbvzla_rate, 'Usdtbnbvzla'),
      processRate(current.syklo_rate, previous.syklo_rate, 'Syklo'),
      processRate(current.mkfrontera_rate, previous.mkfrontera_rate, 'Mkfrontera'),
      processRate(current.eldorado_rate, previous.eldorado_rate, 'Eldorado'),

    ];
  }

  private processBcvRates() {
    if (this.bcvRates.length < 2) return;

    this.bcvComparisons = this.bcvRates.map((rate, index) => {
      const previousRate = index < this.bcvRates.length - 1 ? this.bcvRates[index + 1] : null;
      return {
        date: moment(rate.created_at),
        rate: rate.bcv_rate || 0,
        ...this.calculateDifference(
          rate.bcv_rate || 0,
          previousRate?.bcv_rate || rate.bcv_rate || 0
        )
      };
    });
  }

  private combineRates() {
    this.loadingComparison = true;
    if (this.monitorRates.length === 0 || this.exchangeRates.length === 0) {
      console.error('No hay datos suficientes para combinar');
      this.loadingComparison = false;
      return;
    }

    const monitorRate = this.monitorRates[0];
    const exchangeRate = this.exchangeRates[0];

    const timeDiff = moment(monitorRate.datetime).from(exchangeRate.created_at);


    this.combinedRates = [
      {
        exchange: 'Total',
        monitor_rate: monitorRate.total_rate,
        exchange_rate: exchangeRate.total_rate,
        diferencia: Number((exchangeRate.total_rate - monitorRate.total_rate).toFixed(2)),
        diferencia_porcentaje: Number((((exchangeRate.total_rate - monitorRate.total_rate) / exchangeRate.total_rate) * 100).toFixed(2)),
        tiempo_diferencia: timeDiff,
        last_update_monitor: moment(monitorRate.datetime),
        last_update_exchange: moment(exchangeRate.created_at)
      },
      // Eldorado
      {
        exchange: 'Eldorado',
        monitor_rate: monitorRate.eldorado_rate,
        exchange_rate: exchangeRate.eldorado_rate,
        diferencia: Number((exchangeRate.eldorado_rate-monitorRate.eldorado_rate).toFixed(2)),
        diferencia_porcentaje: Number((((exchangeRate.eldorado_rate-monitorRate.eldorado_rate) / exchangeRate.eldorado_rate) * 100).toFixed(2)),
        tiempo_diferencia: timeDiff,
        last_update_monitor: moment(monitorRate.datetime),
        last_update_exchange: moment(exchangeRate.created_at)
      },
      // Syklo
      {
        exchange: 'Syklo',
        monitor_rate: monitorRate.syklo_rate,
        exchange_rate: exchangeRate.syklo_rate,
        diferencia: Number((exchangeRate.syklo_rate-monitorRate.syklo_rate).toFixed(2)),
        diferencia_porcentaje: Number((((exchangeRate.syklo_rate-monitorRate.syklo_rate) / exchangeRate.syklo_rate) * 100).toFixed(2)),
        tiempo_diferencia: timeDiff,
        last_update_monitor: moment(monitorRate.datetime),
        last_update_exchange: moment(exchangeRate.created_at)
      },
      // Yadio
      {
        exchange: 'Yadio',
        monitor_rate: monitorRate.yadio_rate,
        exchange_rate: exchangeRate.yadio_rate,
        diferencia: Number((exchangeRate.yadio_rate-monitorRate.yadio_rate).toFixed(2)),
        diferencia_porcentaje: Number((((exchangeRate.yadio_rate-monitorRate.yadio_rate) / exchangeRate.yadio_rate) * 100).toFixed(2)),
        tiempo_diferencia: timeDiff,
        last_update_monitor: moment(monitorRate.datetime),
        last_update_exchange: moment(exchangeRate.created_at)
      }
    ];


    const monitorRate2 = this.monitorRates[0];
    const exchangeRate2 = this.exchangeRates[1];

    const timeDiff2 = moment(monitorRate2.datetime).from(exchangeRate2.created_at);
    this.combinedRates2 = [
      {
        exchange: 'Total',
        monitor_rate: monitorRate2.total_rate,
        exchange_rate: exchangeRate2.total_rate,
        diferencia: Number((exchangeRate2.total_rate - monitorRate2.total_rate).toFixed(2)),
        diferencia_porcentaje: Number((((exchangeRate2.total_rate - monitorRate2.total_rate) / exchangeRate2.total_rate) * 100).toFixed(2)),
        tiempo_diferencia: timeDiff2,
        last_update_monitor: moment(monitorRate2.datetime),
        last_update_exchange: moment(exchangeRate2.created_at)
      },
      {
        exchange: 'Eldorado',
        monitor_rate: monitorRate2.eldorado_rate,
        exchange_rate: exchangeRate2.eldorado_rate,
        diferencia: Number((exchangeRate2.eldorado_rate - monitorRate2.eldorado_rate).toFixed(2)),
        diferencia_porcentaje: Number((((exchangeRate2.eldorado_rate - monitorRate2.eldorado_rate) / exchangeRate2.eldorado_rate) * 100).toFixed(2)),
        tiempo_diferencia: timeDiff2,
        last_update_monitor: moment(monitorRate2.datetime),
        last_update_exchange: moment(exchangeRate2.created_at)
      },
      {
        exchange: 'Syklo',
        monitor_rate: monitorRate2.syklo_rate,
        exchange_rate: exchangeRate2.syklo_rate,
        diferencia: Number((exchangeRate2.syklo_rate - monitorRate2.syklo_rate).toFixed(2)),
        diferencia_porcentaje: Number((((exchangeRate2.syklo_rate - monitorRate2.syklo_rate) / exchangeRate2.syklo_rate) * 100).toFixed(2)),
        tiempo_diferencia: timeDiff2,
        last_update_monitor: moment(monitorRate2.datetime),
        last_update_exchange: moment(exchangeRate2.created_at)
      },
      {
        exchange: 'Yadio',
        monitor_rate: monitorRate2.yadio_rate,
        exchange_rate: exchangeRate2.yadio_rate,
        diferencia: Number((exchangeRate2.yadio_rate - monitorRate2.yadio_rate).toFixed(2)),
        diferencia_porcentaje: Number((((exchangeRate2.yadio_rate - monitorRate2.yadio_rate) / exchangeRate2.yadio_rate) * 100).toFixed(2)),
        tiempo_diferencia: timeDiff2,
        last_update_monitor: moment(monitorRate2.datetime),
        last_update_exchange: moment(exchangeRate2.created_at)
      }
    ]

    this.loadingComparison = false;
    this.loadingComparison2 = false;
  }
}
