import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async getHistoricalMonitorRates(startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: Date = new Date()) {
    const { data, error } = await this.supabase
      .from('monitor_rates')
      .select('*')
      .gte('datetime', moment(startDate).format('YYYY-MM-DD'))
      .lte('datetime', moment(endDate).add(1, 'days').format('YYYY-MM-DD'))
      .order('datetime', { ascending: true });

    if (error) {
      console.error('Error cargando historical monitor rates:', error);
      return [];
    }

    return data || [];
  }

  async getHistoricalExchangeRates(startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: Date = new Date()) {
    const { data, error } = await this.supabase
      .from('exchange_rates')
      .select('*')
      .gte('created_at', moment(startDate).format('YYYY-MM-DD'))
      .lte('created_at', moment(endDate).add(1, 'days').format('YYYY-MM-DD'))
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error cargando historical exchange rates:', error);
      return [];
    }

    return data || [];
  }

  async getHistoricalBcvRates(startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: Date = new Date()) {
    const { data, error } = await this.supabase
      .from('bcv_rates')
      .select('*')
      .gte('created_at', moment(startDate).format('YYYY-MM-DD'))
      .lte('created_at', moment(endDate).add(1, 'days').format('YYYY-MM-DD'))
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error cargando historical BCV rates:', error);
      return [];
    }

    return data || [];
  }
}
