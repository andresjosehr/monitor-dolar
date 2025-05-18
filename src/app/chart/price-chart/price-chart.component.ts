import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  LineSeriesOptions,
  DeepPartial,
  ChartOptions,
  UTCTimestamp,
  LineStyle,
  SeriesType,
  LineSeries
} from 'lightweight-charts';
import { SupabaseService } from '../../core/services/supabase.service';
import { DateRangeSelectorComponent, DateRange } from '../date-range-selector/date-range-selector.component';
import moment from 'moment';

interface ChartSeries {
  name: string;
  data: LineData[];
  options: DeepPartial<LineSeriesOptions>;
}

interface ChartSettings {
  theme: 'light' | 'dark';
  showMonitor: boolean;
  showExchange: boolean;
  chartType: 'line' | 'area';
  timeUnit: 'hour' | 'day';
}

@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DateRangeSelectorComponent,
    FormsModule,
    MatSelectModule,
    MatSlideToggleModule
  ],
  templateUrl: './price-chart.component.html',
  styleUrls: ['./price-chart.component.scss']
})
export class PriceChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  // Variables para el gráfico
  private chart?: IChartApi;
  private monitorSeries?: ISeriesApi<"Line">;
  private exchangeSeries?: ISeriesApi<"Line">;

  // Datos y series
  monitorData: LineData[] = [];
  exchangeData: LineData[] = [];

  // Configuración del gráfico
  settings: ChartSettings = {
    theme: 'light',
    showMonitor: true,
    showExchange: true,
    chartType: 'line',
    timeUnit: 'day'
  };

  // Fechas para el filtro
  dateRange: DateRange = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  };

  // Opciones de temas
  readonly themeOptions = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' }
  ];

  // Opciones de tipo de gráfico
  readonly chartTypeOptions = [
    { value: 'line', label: 'Línea' },
    { value: 'area', label: 'Área' }
  ];

  // Opciones de unidad de tiempo
  readonly timeUnitOptions = [
    { value: 'hour', label: 'Hora' },
    { value: 'day', label: 'Día' }
  ];

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    // Cargamos datos iniciales
    this.loadChartData();
  }

  ngAfterViewInit() {
    // Inicializamos el gráfico cuando la vista esté lista
    this.initChart();
  }

  ngOnDestroy() {
    // Limpiamos recursos al destruir el componente
    if (this.chart) {
      this.chart.remove();
    }
  }

  // Gestionar el cambio en el rango de fechas
  onDateRangeChanged(range: DateRange) {
    this.dateRange = range;
    this.loadChartData();
  }

  // Actualizar la configuración del gráfico
  updateChartSettings() {
    this.updateChartTheme();
    this.updateSeriesVisibility();

    // Volver a dibujar el gráfico para aplicar cambios
    this.chart?.applyOptions(this.getChartOptions());

    if (this.monitorSeries && this.exchangeSeries) {
      this.chart?.timeScale().fitContent();
    }
  }

  // Cargar los datos para el gráfico
  async loadChartData() {
    try {
      // Obtener datos históricos de Supabase
      const monitorRates = await this.supabaseService.getHistoricalMonitorRates(
        this.dateRange.startDate, this.dateRange.endDate
      );

      const exchangeRates = await this.supabaseService.getHistoricalExchangeRates(
        this.dateRange.startDate, this.dateRange.endDate
      );

      // Procesar y ordenar los datos para el gráfico
      this.monitorData = monitorRates
        .map(rate => ({
          time: moment(rate.datetime).valueOf() as UTCTimestamp,
          value: rate.total_rate
        }))
        .sort((a, b) => (a.time as number) - (b.time as number))
        // Eliminar duplicados basados en el tiempo
        .filter((item, index, self) =>
          index === 0 || item.time !== self[index - 1].time
        );

      this.exchangeData = exchangeRates
        .map(rate => ({
          time: moment(rate.created_at).valueOf() as UTCTimestamp,
          value: rate.total_rate
        }))
        .sort((a, b) => (a.time as number) - (b.time as number))
        // Eliminar duplicados basados en el tiempo
        // .filter((item, index, self) =>
        //   index === 0 || item.time !== self[index - 1].time
        // );

        console.log(this.exchangeData);

      // Actualizar el gráfico si ya está inicializado
      if (this.chart) {
        this.updateSeries();
      }

    } catch (error) {
      console.error('Error al cargar datos para el gráfico:', error);
    }
  }

  // Inicializar el gráfico
  private initChart() {
    const container = this.chartContainer.nativeElement;

    // Crear el gráfico con las opciones configuradas
    this.chart = createChart(container, this.getChartOptions());

    // Añadir series
    this.monitorSeries = this.chart.addSeries(LineSeries, {
      color: '#2962FF',
      lineWidth: 2,
      title: 'Monitor',
      priceLineVisible: false,
      lastValueVisible: true,
    });

    this.exchangeSeries = this.chart.addSeries(LineSeries, {
      color: '#FF6D00',
      lineWidth: 2,
      title: 'Exchange',
      priceLineVisible: false,
      lastValueVisible: true,
    });

    // Actualizar con los datos iniciales
    this.updateSeries();

    // Hacer que el grafico se ajuste al tamaño del contenedor
    const resizeObserver = new ResizeObserver(() => {
      if (this.chart) {
        this.chart.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    });

    resizeObserver.observe(container);
  }

  // Actualizar las series con los nuevos datos
  private updateSeries() {
    if (!this.chart || !this.monitorSeries || !this.exchangeSeries) return;

    if (this.monitorData.length > 0) {
      this.monitorSeries.setData(this.monitorData);
    }

    if (this.exchangeData.length > 0) {
      this.exchangeSeries.setData(this.exchangeData);
    }

    // Ajustar la escala para mostrar todos los datos
    this.chart.timeScale().fitContent();

    // Actualizar la visibilidad de las series según la configuración
    this.updateSeriesVisibility();
  }

  // Actualizar visibilidad de series según configuración
  private updateSeriesVisibility() {
    if (!this.monitorSeries || !this.exchangeSeries) return;

    this.monitorSeries.applyOptions({
      visible: this.settings.showMonitor
    });

    this.exchangeSeries.applyOptions({
      visible: this.settings.showExchange
    });
  }

  // Actualizar el tema del gráfico
  private updateChartTheme() {
    if (!this.chart) return;

    const options = this.getChartOptions();
    this.chart.applyOptions(options);
  }

  // Obtener opciones del gráfico basadas en la configuración
  private getChartOptions(): DeepPartial<ChartOptions> {
    const isDark = this.settings.theme === 'dark';

    return {
      layout: {
        background: { color: isDark ? '#1E1E1E' : '#FFFFFF' },
        textColor: isDark ? '#D9D9D9' : '#191919',
      },
      grid: {
        vertLines: { color: isDark ? '#2B2B43' : '#E6E6E6' },
        horzLines: { color: isDark ? '#2B2B43' : '#E6E6E6' },
      },
      timeScale: {
        borderColor: isDark ? '#2B2B43' : '#E6E6E6',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: {
          labelBackgroundColor: isDark ? '#4C525E' : '#F5F5F5',
        },
        horzLine: {
          labelBackgroundColor: isDark ? '#4C525E' : '#F5F5F5',
        },
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      width: this.chartContainer?.nativeElement.clientWidth || 800,
      height: 400,
    };
  }

  // Convertir las fechas al formato esperado por el gráfico
  private getTimeForSeries(dateStr: string): number {
    // Formatear según la unidad de tiempo seleccionada
    const date = moment.utc(dateStr);

    if (this.settings.timeUnit === 'hour') {
      // Para unidad horaria, convertir a timestamp en segundos
      return (date.valueOf() / 1000) as UTCTimestamp;
    } else {
      // Para unidad diaria, normalizar a inicio del día y convertir a timestamp en segundos
      return (date.startOf('day').valueOf() / 1000) as UTCTimestamp;
    }
  }
}
