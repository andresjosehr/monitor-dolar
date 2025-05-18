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

type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row'];
type MonitorRate = Database['public']['Tables']['monitor_rates']['Row'];

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
    DecimalPipe
  ]
})
export class InicioComponent implements OnInit {
  exchangeRates: ExchangeRate[] = [];
  monitorRates: MonitorRate[] = [];
  combinedRates: CombinedRate[] = [];

  displayedColumns: string[] = ['exchange', 'exchange_rate', 'monitor_rate', 'diferencia', 'diferencia_porcentaje'];

  constructor(private supabaseService: SupabaseService) {
    moment.locale('es');
  }

  async ngOnInit() {
    await this.loadExchangeRates();
    await this.loadMonitorRates();
    this.combineRates();
  }

  async loadExchangeRates() {
    const { data, error } = await this.supabaseService.getClient()
      .from('exchange_rates')
      .select('*')
      .order('created_at', { ascending: false });

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
      .order('datetime', { ascending: false });

    if (error) {
      console.error('Error cargando monitor rates:', error);
      return;
    }

    this.monitorRates = data || [];
  }

  private combineRates() {
    if (this.exchangeRates.length === 0 || this.monitorRates.length === 0) return;

    const latestExchange = this.exchangeRates[0];
    const latestMonitor = this.monitorRates[0];

    const exchangeMoment = moment(latestExchange.created_at);
    const monitorMoment = moment(latestMonitor.datetime);

    const calculateDifference = (exchange: number, monitor: number) => {
      const diff = Number((exchange - monitor).toFixed(2));
      const percentage = monitor !== 0 ? Number(((diff / monitor) * 100).toFixed(2)) : 0;
      return {
        diferencia: diff,
        diferencia_porcentaje: percentage
      };
    };

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
        exchange: 'Eldorado',
        exchange_rate: latestExchange.eldorado_rate || 0,
        monitor_rate: latestMonitor.eldorado_rate || 0,
        ...calculateDifference(latestExchange.eldorado_rate || 0, latestMonitor.eldorado_rate || 0),
        last_update_exchange: exchangeMoment,
        last_update_monitor: monitorMoment,
        tiempo_diferencia: calculateTimeDifference(exchangeMoment, monitorMoment)
      },
      {
        exchange: 'Syklo',
        exchange_rate: latestExchange.syklo_rate || 0,
        monitor_rate: latestMonitor.syklo_rate || 0,
        ...calculateDifference(latestExchange.syklo_rate || 0, latestMonitor.syklo_rate || 0),
        last_update_exchange: exchangeMoment,
        last_update_monitor: monitorMoment,
        tiempo_diferencia: calculateTimeDifference(exchangeMoment, monitorMoment)
      },
      {
        exchange: 'Yadio',
        exchange_rate: latestExchange.yadio_rate || 0,
        monitor_rate: latestMonitor.yadio_rate || 0,
        ...calculateDifference(latestExchange.yadio_rate || 0, latestMonitor.yadio_rate || 0),
        last_update_exchange: exchangeMoment,
        last_update_monitor: monitorMoment,
        tiempo_diferencia: calculateTimeDifference(exchangeMoment, monitorMoment)
      },
      {
        exchange: 'Total',
        exchange_rate: latestExchange.total_rate || 0,
        monitor_rate: latestMonitor.total_rate || 0,
        ...calculateDifference(latestExchange.total_rate || 0, latestMonitor.total_rate || 0),
        last_update_exchange: exchangeMoment,
        last_update_monitor: monitorMoment,
        tiempo_diferencia: calculateTimeDifference(exchangeMoment, monitorMoment)
      }
    ];
  }
}
