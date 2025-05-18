import { Component, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { Database } from '../../core/interfaces/supabase.types';
import { DatePipe, DecimalPipe } from '@angular/common';
import moment from 'moment';
import 'moment/locale/es';
import { PriceChartComponent } from '../../chart/price-chart/price-chart.component';

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
}

interface MonitorRateComparison {
  exchange: string;
  current_rate: number;
  previous_rate: number;
  diferencia: number;
  diferencia_porcentaje: number;
  last_update: moment.Moment;
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
    CommonModule,
    DatePipe,
    DecimalPipe,
    PriceChartComponent
  ],
  styles: [
    `
    .mdc-data-table__cell, .mdc-data-table__header-cell {
    padding: 0 7px;
}
    `
  ]
})
export class InicioComponent implements OnInit {
  exchangeRates: ExchangeRate[] = [];
  monitorRates: MonitorRate[] = [];
  bcvRates: BcvRate[] = [];
  combinedRates: CombinedRate[] = [];
  exchangeComparisons: ExchangeRateComparison[] = [];
  monitorComparisons: MonitorRateComparison[] = [];
  bcvComparisons: BcvRateComparison[] = [];

  displayedColumns: string[] = ['exchange', 'monitor_rate', 'exchange_rate', 'diferencia'];
  exchangeColumns: string[] = ['exchange', 'previous_rate', 'current_rate', 'diferencia'];
  monitorColumns: string[] = ['exchange', 'previous_rate', 'current_rate', 'diferencia'];
  bcvColumns: string[] = ['date', 'rate', 'diferencia'];

  constructor(private supabaseService: SupabaseService) {
    moment.locale('es');
  }

  async ngOnInit() {
    await this.loadExchangeRates();
    await this.loadMonitorRates();
    await this.loadBcvRates();
    this.combineRates();
    this.processExchangeRates();
    this.processMonitorRates();
    this.processBcvRates();
  }

  async loadExchangeRates() {
    const { data, error } = await this.supabaseService.getClient()
      .from('exchange_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2);

    if (error) {
      console.error('Error cargando exchange rates:', error);
      return;
    }

    this.exchangeRates = data || [];
  }

  async loadMonitorRates() {
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
  }

  async loadBcvRates() {
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

    const processRate = (currentRate: number, previousRate: number, exchangeName: string) => ({
      exchange: exchangeName,
      current_rate: currentRate || 0,
      previous_rate: previousRate || 0,
      ...this.calculateDifference(currentRate || 0, previousRate || 0),
      last_update: currentMoment
    });

    this.exchangeComparisons = [
      processRate(current.total_rate, previous.total_rate, 'Total'),
      processRate(current.eldorado_rate, previous.eldorado_rate, 'Binance'),
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

    const processRate = (currentRate: number, previousRate: number, exchangeName: string) => ({
      exchange: exchangeName,
      current_rate: currentRate || 0,
      previous_rate: previousRate || 0,
      ...this.calculateDifference(currentRate || 0, previousRate || 0),
      last_update: currentMoment
    });

    this.monitorComparisons = [

      processRate(current.total_rate, previous.total_rate, 'Total'),
      processRate(current.yadio_rate, previous.yadio_rate, 'Yadio'),
      processRate(current.eldorado_rate, previous.eldorado_rate, 'CambiosRya'),
      processRate(current.eldorado_rate, previous.eldorado_rate, 'Airtm'),
      processRate(current.eldorado_rate, previous.eldorado_rate, 'Usdtbnbvzla'),
      processRate(current.eldorado_rate, previous.eldorado_rate, 'Syklo'),
      processRate(current.eldorado_rate, previous.eldorado_rate, 'Mkfrontera'),
      processRate(current.eldorado_rate, previous.eldorado_rate, 'Billeterap2p'),
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
    if (this.exchangeRates.length === 0 || this.monitorRates.length === 0) return;

    const latestExchange = this.exchangeRates[0];
    const latestMonitor = this.monitorRates[0];

    const exchangeMoment = moment(latestExchange.created_at);
    const monitorMoment = moment(latestMonitor.datetime);

    const calculateTimeDifference = (time1: moment.Moment, time2: moment.Moment): string => {
      const diffMinutes = Math.abs(time1.diff(time2, 'minutes'));
      if (diffMinutes < 60) {
        return `${diffMinutes} minutos`;
      }
      const diffHours = Math.floor(diffMinutes / 60);
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes === 0) {
        return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
      }
      return `${diffHours} hora${diffHours !== 1 ? 's' : ''} y ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
    };

    this.combinedRates = [
      {
        exchange: 'Total',
        exchange_rate: latestExchange.total_rate || 0,
        monitor_rate: latestMonitor.total_rate || 0,
        ...this.calculateDifference(latestExchange.total_rate || 0, latestMonitor.total_rate || 0),
        last_update_exchange: exchangeMoment,
        last_update_monitor: monitorMoment,
        tiempo_diferencia: calculateTimeDifference(exchangeMoment, monitorMoment)
      },
      {
        exchange: 'Eldorado',
        exchange_rate: latestExchange.eldorado_rate || 0,
        monitor_rate: latestMonitor.eldorado_rate || 0,
        ...this.calculateDifference(latestExchange.eldorado_rate || 0, latestMonitor.eldorado_rate || 0),
        last_update_exchange: exchangeMoment,
        last_update_monitor: monitorMoment,
        tiempo_diferencia: calculateTimeDifference(exchangeMoment, monitorMoment)
      },
      {
        exchange: 'Syklo',
        exchange_rate: latestExchange.syklo_rate || 0,
        monitor_rate: latestMonitor.syklo_rate || 0,
        ...this.calculateDifference(latestExchange.syklo_rate || 0, latestMonitor.syklo_rate || 0),
        last_update_exchange: exchangeMoment,
        last_update_monitor: monitorMoment,
        tiempo_diferencia: calculateTimeDifference(exchangeMoment, monitorMoment)
      },
      {
        exchange: 'Yadio',
        exchange_rate: latestExchange.yadio_rate || 0,
        monitor_rate: latestMonitor.yadio_rate || 0,
        ...this.calculateDifference(latestExchange.yadio_rate || 0, latestMonitor.yadio_rate || 0),
        last_update_exchange: exchangeMoment,
        last_update_monitor: monitorMoment,
        tiempo_diferencia: calculateTimeDifference(exchangeMoment, monitorMoment)
      },
    ];
  }
}
