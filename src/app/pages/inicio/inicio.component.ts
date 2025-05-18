import { Component, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { SupabaseService } from '../../core/services/supabase.service';
import { Database } from '../../core/interfaces/supabase.types';
import { DatePipe } from '@angular/common';

type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row'];
type MonitorRate = Database['public']['Tables']['monitor_rates']['Row'];

@Component({
  selector: 'app-inicio',
  standalone: true,
  templateUrl: './inicio.component.html',
  styles: [],
  imports: [MatTableModule, MatCardModule, DatePipe]
})
export class InicioComponent implements OnInit {
  exchangeRates: ExchangeRate[] = [];
  monitorRates: MonitorRate[] = [];

  displayedColumnsExchange: string[] = ['id', 'binance_rate', 'eldorado_rate', 'syklo_rate', 'yadio_rate', 'total_rate', 'created_at'];
  displayedColumnsMonitor: string[] = ['id', 'airtm_rate', 'billeterap2p_rate', 'cambiosrya_rate', 'eldorado_rate', 'mkfrontera_rate', 'syklo_rate', 'usdtbnbvzla_rate', 'yadio_rate', 'total_rate', 'datetime'];

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.loadExchangeRates();
    await this.loadMonitorRates();
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
}
