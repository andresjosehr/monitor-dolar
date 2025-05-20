import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { FilterPipe } from '../pipes/filter.pipe';
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
  PriceLineSource,
  IPriceLine,
  createSeriesMarkers,
  SeriesMarker
} from 'lightweight-charts';
import { SupabaseService } from '../../core/services/supabase.service';
import { DateRangeSelectorComponent, DateRange } from '../date-range-selector/date-range-selector.component';
import moment from 'moment';

interface ChartSeries {
  id: string;
  name: string;
  data: LineData[];
  options: DeepPartial<LineSeriesOptions>;
  series?: ISeriesApi<"Line">;
  visible: boolean;
  type: 'monitor' | 'exchange' | 'bcv';
  isTotal?: boolean;
  priceLine?: IPriceLine;
}

interface ChartSettings {
  theme: 'light' | 'dark';
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
    MatSlideToggleModule,
    MatChipsModule,
    FilterPipe
  ],
  templateUrl: './price-chart.component.html'
})
export class PriceChartComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  // Variables para el gráfico
  private chart?: IChartApi;

  // Series disponibles
  series: ChartSeries[] = [];

  // Serie para marcadores
  private monitorMarkersData: LineData[] = [];
  private monitorMarkersSeries?: ISeriesApi<"Line">;

  // Configuración del gráfico
  settings: ChartSettings = {
    theme: 'light',
    chartType: 'line',
    timeUnit: 'day'
  };

  // Control de visibilidad de marcadores
  showMonitorMarkers = true;

  // Fechas para el filtro
  dateRange: DateRange = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  };

  // Colores para las series
  readonly seriesColors = {
    monitor: {
      total: '#2962FF',
      airtm: '#4CAF50',
      billeterap2p: '#9C27B0',
      cambiosrya: '#FF9800',
      eldorado: '#F44336',
      mkfrontera: '#3F51B5',
      syklo: '#009688',
      usdtbnbvzla: '#795548',
      yadio: '#607D8B',
      avg: '#000000'
    },
    exchange: {
      total: '#FF6D00',
      binance: '#F9A825',
      eldorado: '#F44336',
      syklo: '#009688',
      yadio: '#607D8B'
    },
    bcv: {
      rate: '#E91E63'
    }
  };

  private monitorTotalPriceLine?: IPriceLine;

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    // Cargamos datos iniciales
    // this.loadChartData();
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
    this.chart?.timeScale().fitContent();
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

      const bcvRates = await this.supabaseService.getHistoricalBcvRates(
        this.dateRange.startDate, this.dateRange.endDate
      );

      // Limpiar series existentes
      this.series = [];

      // Procesar datos de BCV
      if (bcvRates.length > 0) {
        this.addSeries({
          id: 'bcv_rate',
          name: 'BCV',
          type: 'bcv',
          data: this.processRateData(bcvRates, 'bcv_rate', 'created_at'),
          options: {
            color: this.seriesColors.bcv.rate,
            lineWidth: 2,
            lastValueVisible: true,
            priceLineVisible: false,
          },
          visible: true
        });
      }

      // Procesar datos de Monitor
      if (monitorRates.length > 0) {
        // Serie total de Monitor
        const monitorTotalData = this.processRateData(monitorRates, 'total_rate', 'datetime');

        // Guardar datos para la serie de marcadores
        this.monitorMarkersData = [...monitorTotalData];

        this.addSeries({
          id: 'monitor_total',
          name: 'Monitor Total',
          type: 'monitor',
          data: monitorTotalData,
          options: {
            color: this.seriesColors.monitor.total,
            lineWidth: 2,
            // title: 'Monitor Total',
            priceLineVisible: false,
            lastValueVisible: true,
          },
          visible: true,
          isTotal: true,
        });

        // Series individuales de Monitor
        const monitorFields = [
          { id: 'airtm', name: 'AirTM' },
          { id: 'billeterap2p', name: 'Billetera P2P' },
          { id: 'cambiosrya', name: 'Cambios RyA' },
          { id: 'eldorado', name: 'El Dorado' },
          { id: 'mkfrontera', name: 'MK Frontera' },
          { id: 'syklo', name: 'Syklo' },
          { id: 'usdtbnbvzla', name: 'USDT BNB VZLA' },
          { id: 'yadio', name: 'Yadio' },
          // { id: 'avg', name: 'Promedio' }
        ];

        monitorFields
        .forEach(field => {
          this.addSeries({
            id: `monitor_${field.id}`,
            name: field.name,
            type: 'monitor',
            data: this.processRateData(monitorRates, `${field.id}_rate`, 'datetime'),
            options: {
              color: this.seriesColors.monitor[field.id as keyof typeof this.seriesColors.monitor],
              lineWidth: 1,
              // title: field.name,
              lastValueVisible: true,
              priceLineVisible: false,
            },
            visible: false
          })
        });
      }

      // Procesar datos de Exchange
      if (exchangeRates.length > 0) {
        // Serie total de Exchange
        this.addSeries({
          id: 'exchange_total',
          name: 'Exchange Total',
          type: 'exchange',
          data: this.processRateData(exchangeRates, 'total_rate', 'created_at'),
          options: {
            color: this.seriesColors.exchange.total,
            lineWidth: 2,
            // title: 'Exchange Total',
            lastValueVisible: true,
            priceLineVisible: false,
          },
          visible: true,
          isTotal: true
        });

        // Series individuales de Exchange
        const exchangeFields = [
          { id: 'binance', name: 'Binance' },
          { id: 'eldorado', name: 'El Dorado' },
          { id: 'syklo', name: 'Syklo' },
          { id: 'yadio', name: 'Yadio' }
        ];

        exchangeFields.forEach(field => {
          this.addSeries({
            id: `exchange_${field.id}`,
            name: field.name,
            type: 'exchange',
            data: this.processRateData(exchangeRates, `${field.id}_rate`, 'created_at'),
            options: {
              color: this.seriesColors.exchange[field.id as keyof typeof this.seriesColors.exchange],
              lineWidth: 1,
              // title: field.name,
              lastValueVisible: true,
              priceLineVisible: false,
            },
            visible: false
          });
        });
      }

      // Actualizar el gráfico si ya está inicializado
      if (this.chart) {
        this.updateAllSeries();
      }

    } catch (error) {
      console.error('Error al cargar datos para el gráfico:', error);
    }
  }

  // Procesar datos de tasas
  private processRateData(rates: any[], rateField: string, timeField: string): LineData[] {
    return rates
      .map(rate => ({
        time: this.getTimeForSeries(moment(rate[timeField])) as UTCTimestamp,
        value: rate[rateField]
      }))
      .sort((a, b) => (a.time as number) - (b.time as number))
      .filter((item, index, self) =>
        index === 0 || item.time !== self[index - 1].time
      );
  }

  // Añadir una nueva serie
  private addSeries(series: ChartSeries) {
    this.series.push(series);
  }

  // Inicializar el gráfico
  private initChart() {
    const container = this.chartContainer.nativeElement;

    // Crear el gráfico con las opciones configuradas
    this.chart = createChart(container, this.getChartOptions());

    // Inicializar todas las series
    this.updateAllSeries();

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

  // Actualizar todas las series
  private updateAllSeries() {
    if (!this.chart) return;

    // Remover serie de marcadores si existe
    if (this.monitorMarkersSeries) {
      this.chart.removeSeries(this.monitorMarkersSeries);
      this.monitorMarkersSeries = undefined;
    }

    // Eliminar series existentes
    this.series.forEach(series => {
      if (series.series) {
        if (series.priceLine) {
          series.series.removePriceLine(series.priceLine);
          series.priceLine = undefined;
        }
        this.chart?.removeSeries(series.series);
        series.series = undefined;
      }
    });

    // Añadir series nuevas
    this.series.forEach(series => {
      // Asegurarnos de que todas las series tengan priceLineVisible en false
      const options = {
        ...series.options,
        priceLineVisible: false
      };

      series.series = this.chart?.addSeries(LineSeries, options);
      series.series?.setData(series.data);
    });

    // Actualizar visibilidad
    this.updateSeriesVisibility();

    // Añadir línea horizontal con el último valor de monitor total
    this.addMonitorTotalPriceLine();

    // Añadir marcadores como una serie independiente
    this.addMonitorMarkers();

    // Ajustar la escala para mostrar todos los datos
    this.chart.timeScale().fitContent();
  }

  // Añadir marcadores como una serie independiente
  private addMonitorMarkers() {
    if (!this.chart || !this.showMonitorMarkers || this.monitorMarkersData.length === 0) return;

    // Crear una serie de línea para los marcadores
    this.monitorMarkersSeries = this.chart.addSeries(LineSeries, {
      color: '#5C9DFF',
      lineVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
      lineStyle: LineStyle.Dotted,
      lineWidth: 1,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 6,
      title: 'Monitor Markers'
    });

    // Establecer los datos
    this.monitorMarkersSeries.setData(this.monitorMarkersData);

    // Añadir los marcadores usando createSeriesMarkers
    const markers: SeriesMarker<UTCTimestamp>[] = this.monitorMarkersData.map(dataPoint => ({
      time: dataPoint.time as UTCTimestamp,
      position: 'inBar',
      color: '#5C9DFF',
      shape: 'circle',
      size: 6
    }));

    createSeriesMarkers(this.monitorMarkersSeries, markers);

    // Actualizar visibilidad
    const monitorTotalSeries = this.series.find(s => s.id === 'monitor_total');
    if (monitorTotalSeries) {
      this.monitorMarkersSeries.applyOptions({
        visible: monitorTotalSeries.visible && this.showMonitorMarkers
      });
    }
  }

  // Añadir línea horizontal con el último valor de monitor total
  private addMonitorTotalPriceLine() {
    const monitorTotalSeries = this.series.find(s => s.id === 'monitor_total');
    if (monitorTotalSeries?.series && monitorTotalSeries.data.length > 0) {
      const lastValue = monitorTotalSeries.data[monitorTotalSeries.data.length - 1].value;

      this.monitorTotalPriceLine = monitorTotalSeries.series.createPriceLine({
        price: lastValue,
        color: monitorTotalSeries.options.color as string,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: ``
      });
    }
  }

  // Actualizar visibilidad de series según configuración
  private updateSeriesVisibility() {
    this.series.forEach(series => {
      if (series.series) {
        series.series.applyOptions({
          visible: series.visible
        });
      }
    });

    // Actualizar también la visibilidad de la serie de marcadores
    if (this.monitorMarkersSeries) {
      const monitorTotalSeries = this.series.find(s => s.id === 'monitor_total');
      this.monitorMarkersSeries.applyOptions({
        visible: monitorTotalSeries?.visible && this.showMonitorMarkers
      });
    }
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
    return Math.floor((momentObj.valueOf() - 4 * 60 * 60 * 1000) / 1000) as UTCTimestamp;
  }

  // Alternar visibilidad de una serie individual
  toggleSeries(seriesId: string) {
    const series = this.series.find(s => s.id === seriesId);
    if (!series) return;

    // Permitir ocultar cualquier serie, incluidas las series totales
    series.visible = !series.visible;
    this.updateSeriesVisibility();

    // Si estamos alternando monitor_total, actualizar también los marcadores
    if (seriesId === 'monitor_total' && this.monitorMarkersSeries) {
      this.monitorMarkersSeries.applyOptions({
        visible: series.visible && this.showMonitorMarkers
      });
    }
  }

  // Alternar visibilidad de los marcadores de monitor_total
  toggleMonitorMarkers() {
    this.showMonitorMarkers = !this.showMonitorMarkers;

    if (this.monitorMarkersSeries) {
      const monitorTotalSeries = this.series.find(s => s.id === 'monitor_total');
      this.monitorMarkersSeries.applyOptions({
        visible: monitorTotalSeries?.visible && this.showMonitorMarkers
      });
    } else if (this.showMonitorMarkers) {
      // Si no existe la serie de marcadores pero queremos mostrarlos, la añadimos
      this.addMonitorMarkers();
    }
  }
}
