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
  LineSeries,
  PriceLineSource
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
          time: this.getTimeForSeries(moment(rate.datetime)) as UTCTimestamp,
          value: rate.total_rate
        }))
        .sort((a, b) => (a.time as number) - (b.time as number))
        // Eliminar duplicados basados en el tiempo
        .filter((item, index, self) =>
          index === 0 || item.time !== self[index - 1].time
        );

      this.exchangeData = exchangeRates
        .map(rate => ({
          time: this.getTimeForSeries(moment(rate.created_at)) as UTCTimestamp,
          value: rate.total_rate
        }))
        .sort((a, b) => (a.time as number) - (b.time as number))
        // Eliminar duplicados basados en el tiempo
        .filter((item, index, self) =>
          index === 0 || item.time !== self[index - 1].time
        );


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
      title: '',
      priceLineVisible: true,
      priceLineColor: '#2962FF',
      priceLineWidth: 1,
      priceLineStyle: LineStyle.Dashed,
      lastValueVisible: true,
    });

    this.exchangeSeries = this.chart.addSeries(LineSeries, {
      color: '#FF6D00',
      lineWidth: 2,
      title: '',
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
      // Configurar la línea de precio con el último valor
      const lastMonitorValue = this.monitorData[this.monitorData.length - 1].value;
      this.monitorSeries.applyOptions({
        priceLineVisible: true,
        priceLineColor: '#2962FF',
        priceLineWidth: 1,
        priceLineStyle: LineStyle.Dashed,
        priceLineSource: PriceLineSource.LastVisible,
      });
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
        tickMarkFormatter: (time: UTCTimestamp) => {
          const date = new Date(time * 1000);
          return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        },
        rightOffset: 5,
        barSpacing: 5,
        minBarSpacing: 5,
        fixLeftEdge: true,
        fixRightEdge: true
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
  private getTimeForSeries(momentObj: moment.Moment): number {
    // return Math.floor(momentObj.valueOf() / 1000) as UTCTimestamp;
    // Substract 4 hours to the date
    return Math.floor((momentObj.valueOf() - 4 * 60 * 60 * 1000) / 1000) as UTCTimestamp;
  }
}
