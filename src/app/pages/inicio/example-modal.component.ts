import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SupabaseService } from '../../core/services/supabase.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DecimalPipe } from '@angular/common';
import moment from 'moment';
import { MatTabsModule } from '@angular/material/tabs';

interface ComparisonData {
  id: number;
  monitorDate: string;
  exchangeDate: string;
  monitorTotal: number;
  exchangeTotal: number;
  difference: number;
  diffPercentage: number;
  details: {
    source: string;
    monitorRate: number;
    exchangeRate: number;
    difference: number;
    diffPercentage: number;
  }[];
  formattedDate: string;
}

@Component({
  selector: 'app-example-modal',
  standalone: true,
  imports: [
    MatTableModule,
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    DecimalPipe,
    MatTabsModule
  ],
  template: `
    <h2 mat-dialog-title>Historial de Comparación</h2>
    <mat-dialog-content>
      <div *ngIf="loading" class="spinner-container">
        <mat-spinner></mat-spinner>
      </div>

      <mat-tab-group *ngIf="!loading">
        <mat-tab label="Resumen">
          <table mat-table [dataSource]="dataSource" multiTemplateDataRows class="w-full !bg-transparent">
            <!-- Columna Fecha -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-semibold bg-gray-50 !text-sm md:!text-sm">Fecha</th>
              <td mat-cell *matCellDef="let element" class="!border-gray-300 py-3 !text-sm md:!text-sm capitalize" style="white-space: nowrap;">{{element.formattedDate}}</td>
            </ng-container>

            <!-- Columna Monitor Total -->
            <ng-container matColumnDef="monitorTotal">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-semibold bg-gray-50 !text-sm md:!text-sm">
                <div>Mon</div>
              </th>
              <td mat-cell *matCellDef="let element" class="!border-gray-300 py-3 !text-sm md:!text-sm">
                <div>{{element.monitorTotal | number:'1.2-2'}}</div>
                <div class="text-xs text-gray-500">{{ element.monitorDate.split(' ')[1] }}</div>
              </td>
            </ng-container>

            <!-- Columna Exchange Total -->
            <ng-container matColumnDef="exchangeTotal">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-semibold bg-gray-50 !text-sm md:!text-sm">
                <div>Exch</div>
              </th>
              <td mat-cell *matCellDef="let element" class="!border-gray-300 py-3 !text-sm md:!text-sm">
                <div>{{element.exchangeTotal | number:'1.2-2'}}</div>
                <div class="text-xs text-gray-500">{{ element.exchangeDate.split(' ')[1] }}</div>
              </td>
            </ng-container>

            <!-- Columna Diferencia -->
            <ng-container matColumnDef="difference">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-bold bg-gray-50 !text-sm md:!text-sm">Diff</th>
              <td mat-cell *matCellDef="let element"
                  [ngClass]="{'text-rose-500': element.difference < 0, 'text-emerald-500': element.difference > 0, 'text-gray-500': element.difference === 0}"
                  class="py-3 !border-gray-300 !text-sm md:!text-sm">
                <b style="white-space: nowrap;">{{ element.difference > 0 ? "▲" : (element.difference < 0 ? "▼" : "=") }}
                  {{element.difference | number:'1.2-2'}} / {{element.diffPercentage | number:'1.2-2'}}%
                </b>
              </td>
            </ng-container>

            <!-- Columna de Detalles Expandidos -->
            <ng-container matColumnDef="expandedDetail">
              <td mat-cell *matCellDef="let element" [attr.colspan]="displayedColumns.length">
                <div class="example-element-detail"
                    [@detailExpand]="element == expandedElement ? 'expanded' : 'collapsed'">
                  <div>
                    <table mat-table [dataSource]="element.details" class="mb-6">
                      <ng-container matColumnDef="source">
                        <th mat-header-cell *matHeaderCellDef>Fuente</th>
                        <td mat-cell *matCellDef="let detail">{{detail.source}}</td>
                      </ng-container>

                      <ng-container matColumnDef="monitorRate">
                        <th mat-header-cell *matHeaderCellDef>Monitor</th>
                        <td mat-cell *matCellDef="let detail">{{detail.monitorRate | number:'1.2-2'}}</td>
                      </ng-container>

                      <ng-container matColumnDef="exchangeRate">
                        <th mat-header-cell *matHeaderCellDef>Exchange</th>
                        <td mat-cell *matCellDef="let detail">{{detail.exchangeRate | number:'1.2-2'}}</td>
                      </ng-container>

                      <ng-container matColumnDef="difference">
                        <th mat-header-cell *matHeaderCellDef>Diferencia</th>
                        <td mat-cell *matCellDef="let detail"
                            [ngClass]="{'text-rose-500': detail.difference < 0, 'text-emerald-500': detail.difference > 0, 'text-gray-500': detail.difference === 0}">
                          <b style="white-space: nowrap;">{{ detail.difference > 0 ? "▲" : (detail.difference < 0 ? "▼" : "=") }}
                            {{detail.difference | number:'1.2-2'}} / {{detail.diffPercentage | number:'1.2-2'}}%
                          </b>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="detailColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: detailColumns;" class="!h-10"></tr>
                    </table>
                  </div>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let element; columns: displayedColumns;"
                class="example-element-row hover:bg-gray-200 transition-colors !h-10"
                [class.example-expanded-row]="expandedElement === element"
                (click)="expandedElement = expandedElement === element ? null : element">
            </tr>
            <tr mat-row *matRowDef="let row; columns: ['expandedDetail']" class="example-detail-row"></tr>

          </table>
        </mat-tab>

        <mat-tab label="El dorado">
          <table mat-table [dataSource]="eldoradoDataSource" class="w-full !bg-transparent">
            <!-- Columna Fecha -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-semibold bg-gray-50 !text-sm md:!text-sm">Fecha</th>
              <td mat-cell *matCellDef="let element" class="!border-gray-300 py-3 !text-sm md:!text-sm capitalize" style="white-space: nowrap;">{{element.formattedDate}}</td>
            </ng-container>

            <!-- Columna Monitor Eldorado -->
            <ng-container matColumnDef="eldoradoMonitorRate">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-semibold bg-gray-50 !text-sm md:!text-sm">Monitor</th>
              <td mat-cell *matCellDef="let element" class="!border-gray-300 py-3 !text-sm md:!text-sm">
                <div>{{element.detail.monitorRate | number:'1.2-2'}}</div>
                <div class="text-xs text-gray-500">{{ element.monitorDate.split(' ')[1] }}</div>
              </td>
            </ng-container>

            <!-- Columna Exchange Eldorado -->
            <ng-container matColumnDef="eldoradoExchangeRate">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-semibold bg-gray-50 !text-sm md:!text-sm">Exchange</th>
              <td mat-cell *matCellDef="let element" class="!border-gray-300 py-3 !text-sm md:!text-sm">
                <div>{{element.detail.exchangeRate | number:'1.2-2'}}</div>
                <div class="text-xs text-gray-500">{{ element.exchangeDate.split(' ')[1] }}</div>
              </td>
            </ng-container>

            <!-- Columna Diferencia Eldorado -->
            <ng-container matColumnDef="eldoradoDifference">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-bold bg-gray-50 !text-sm md:!text-sm">Diff</th>
              <td mat-cell *matCellDef="let element"
                  [ngClass]="{
                    'text-rose-500': element.detail.difference < 0,
                    'text-emerald-500': element.detail.difference > 0,
                    'text-gray-500': element.detail.difference === 0
                  }"
                  class="py-3 !border-gray-300 !text-sm md:!text-sm">
                <b style="white-space: nowrap;">
                  {{ element.detail.difference > 0 ? "▲" : (element.detail.difference < 0 ? "▼" : "=") }}
                  {{element.detail.difference | number:'1.2-2'}} / {{element.detail.diffPercentage | number:'1.2-2'}}%
                </b>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="eldoradoDisplayedColumns"></tr>
            <tr mat-row *matRowDef="let element; columns: eldoradoDisplayedColumns;" class="!h-10"></tr>
          </table>
        </mat-tab>

        <mat-tab label="Syklo">
          <table mat-table [dataSource]="sykloDataSource" class="w-full !bg-transparent">
            <!-- Columna Fecha -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-semibold bg-gray-50 !text-sm md:!text-sm">Fecha</th>
              <td mat-cell *matCellDef="let element" class="!border-gray-300 py-3 !text-sm md:!text-sm capitalize" style="white-space: nowrap;">{{element.formattedDate}}</td>
            </ng-container>

            <!-- Columna Monitor Syklo -->
            <ng-container matColumnDef="sykloMonitorRate">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-semibold bg-gray-50 !text-sm md:!text-sm">Monitor</th>
              <td mat-cell *matCellDef="let element" class="!border-gray-300 py-3 !text-sm md:!text-sm">
                <div>{{element.detail.monitorRate | number:'1.2-2'}}</div>
                <div class="text-xs text-gray-500">{{ element.monitorDate.split(' ')[1] }}</div>
              </td>
            </ng-container>

            <!-- Columna Exchange Syklo -->
            <ng-container matColumnDef="sykloExchangeRate">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-semibold bg-gray-50 !text-sm md:!text-sm">Exchange</th>
              <td mat-cell *matCellDef="let element" class="!border-gray-300 py-3 !text-sm md:!text-sm">
                <div>{{element.detail.exchangeRate | number:'1.2-2'}}</div>
                <div class="text-xs text-gray-500">{{ element.exchangeDate.split(' ')[1] }}</div>
              </td>
            </ng-container>

            <!-- Columna Diferencia Syklo -->
            <ng-container matColumnDef="sykloDifference">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-bold bg-gray-50 !text-sm md:!text-sm">Diff</th>
              <td mat-cell *matCellDef="let element"
                  [ngClass]="{
                    'text-rose-500': element.detail.difference < 0,
                    'text-emerald-500': element.detail.difference > 0,
                    'text-gray-500': element.detail.difference === 0
                  }"
                  class="py-3 !border-gray-300 !text-sm md:!text-sm">
                <b style="white-space: nowrap;">
                  {{ element.detail.difference > 0 ? "▲" : (element.detail.difference < 0 ? "▼" : "=") }}
                  {{element.detail.difference | number:'1.2-2'}} / {{element.detail.diffPercentage | number:'1.2-2'}}%
                </b>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="sykloDisplayedColumns"></tr>
            <tr mat-row *matRowDef="let element; columns: sykloDisplayedColumns;" class="!h-10"></tr>
          </table>
        </mat-tab>

        <mat-tab label="Yadio">
          <table mat-table [dataSource]="yadioDataSource" class="w-full !bg-transparent">
            <!-- Columna Fecha -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-semibold bg-gray-50 !text-sm md:!text-sm">Fecha</th>
              <td mat-cell *matCellDef="let element" class="!border-gray-300 py-3 !text-sm md:!text-sm capitalize" style="white-space: nowrap;">{{element.formattedDate}}</td>
            </ng-container>

            <!-- Columna Monitor Yadio -->
            <ng-container matColumnDef="yadioMonitorRate">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-semibold bg-gray-50 !text-sm md:!text-sm">Monitor</th>
              <td mat-cell *matCellDef="let element" class="!border-gray-300 py-3 !text-sm md:!text-sm">
                <div>{{element.detail.monitorRate | number:'1.2-2'}}</div>
                <div class="text-xs text-gray-500">{{ element.monitorDate.split(' ')[1] }}</div>
              </td>
            </ng-container>

            <!-- Columna Exchange Yadio -->
            <ng-container matColumnDef="yadioExchangeRate">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-semibold bg-gray-50 !text-sm md:!text-sm">Exchange</th>
              <td mat-cell *matCellDef="let element" class="!border-gray-300 py-3 !text-sm md:!text-sm">
                <div>{{element.detail.exchangeRate | number:'1.2-2'}}</div>
                <div class="text-xs text-gray-500">{{ element.exchangeDate.split(' ')[1] }}</div>
              </td>
            </ng-container>

            <!-- Columna Diferencia Yadio -->
            <ng-container matColumnDef="yadioDifference">
              <th mat-header-cell *matHeaderCellDef class="!border-gray-300 font-bold bg-gray-50 !text-sm md:!text-sm">Diff</th>
              <td mat-cell *matCellDef="let element"
                  [ngClass]="{
                    'text-rose-500': element.detail.difference < 0,
                    'text-emerald-500': element.detail.difference > 0,
                    'text-gray-500': element.detail.difference === 0
                  }"
                  class="py-3 !border-gray-300 !text-sm md:!text-sm">
                <b style="white-space: nowrap;">
                  {{ element.detail.difference > 0 ? "▲" : (element.detail.difference < 0 ? "▼" : "=") }}
                  {{element.detail.difference | number:'1.2-2'}} / {{element.detail.diffPercentage | number:'1.2-2'}}%
                </b>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="yadioDisplayedColumns"></tr>
            <tr mat-row *matRowDef="let element; columns: yadioDisplayedColumns;" class="!h-10"></tr>
          </table>
        </mat-tab>
      </mat-tab-group>

      <mat-paginator
        *ngIf="!loading"
        [length]="totalRecords"
        [pageSize]="pageSize"
        [pageSizeOptions]="[5, 10, 20]"
        (page)="handlePageEvent($event)">
      </mat-paginator>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    tr.example-detail-row {
      height: 0;
    }

    tr.example-element-row:not(.example-expanded-row):hover {
      background: whitesmoke;
    }

    tr.example-element-row:not(.example-expanded-row):active {
      background: #efefef;
    }

    .example-element-detail {
      overflow: hidden;
    }

    .inner-table {
      margin: 1rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 4px;
    }

    .inner-table table {
      margin-top: 1rem;
    }

    .spinner-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }

    .negative {
      color: #f44336;
    }

    .positive {
      color: #4caf50;
    }

    ::ng-deep .mat-mdc-tab-group.mat-mdc-tab-group-stretch-tabs>.mat-mdc-tab-header .mat-mdc-tab {
      height: 20px;
    }
    ::ng-deep{
    @media (max-width: 768px) {
       .mdc-data-table__cell {
          padding: 0px 0px !important;
        }
    }
    }
  `],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ExampleModalComponent implements OnInit {
  displayedColumns: string[] = ['date', 'monitorTotal', 'exchangeTotal', 'difference'];
  detailColumns: string[] = ['source', 'monitorRate', 'exchangeRate', 'difference'];
  expandedElement: ComparisonData | null = null;
  dataSource: ComparisonData[] = [];

  eldoradoDataSource: any[] = [];
  sykloDataSource: any[] = [];
  yadioDataSource: any[] = [];

  // Paginación
  pageSize = 10;
  pageIndex = 0;
  totalRecords = 0;
  loading = true;

  eldoradoDisplayedColumns: string[] = ['date', 'eldoradoMonitorRate', 'eldoradoExchangeRate', 'eldoradoDifference'];
  sykloDisplayedColumns: string[] = ['date', 'sykloMonitorRate', 'sykloExchangeRate', 'sykloDifference'];
  yadioDisplayedColumns: string[] = ['date', 'yadioMonitorRate', 'yadioExchangeRate', 'yadioDifference'];

  constructor(
    public dialogRef: MatDialogRef<ExampleModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading = true;

    try {
      // Cargar monitor_rates con paginación
      const { data: monitorData, count, error: monitorError } = await this.supabaseService.getClient()
        .from('monitor_rates')
        .select('*', { count: 'exact' })
        .order('datetime', { ascending: false })
        .range(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize - 1);

      if (monitorError) {
        console.error('Error cargando monitor rates:', monitorError);
        this.loading = false;
        return;
      }

      if (count) {
        this.totalRecords = count;
      }

      if (!monitorData || monitorData.length === 0) {
        this.loading = false;
        return;
      }

      // Procesar los datos para la tabla
      const tempDataSource = await Promise.all(monitorData.map(async (monitorRate) => {
        // Para cada monitor_rate, encontrar el exchange_rate más cercano
        const { data: exchangeData, error: exchangeError } = await this.supabaseService.getClient()
          .from('exchange_rates')
          .select('*')
          .lte('created_at', monitorRate.datetime)
          .order('created_at', { ascending: false })
          .limit(1);

        if (exchangeError) {
          console.error('Error cargando exchange rate:', exchangeError);
          return null;
        }

        if (!exchangeData || exchangeData.length === 0) {
          return null;
        }

        const exchangeRate = exchangeData[0];

        // Calcular la diferencia
        const difference = Number((exchangeRate.total_rate - monitorRate.total_rate).toFixed(2));
        const diffPercentage = Number((((exchangeRate.total_rate - monitorRate.total_rate) / exchangeRate.total_rate) * 100).toFixed(2));

        // Crear los detalles para cada fuente
        const details = [
          {
            source: 'Eldorado',
            monitorRate: monitorRate.eldorado_rate,
            exchangeRate: exchangeRate.eldorado_rate,
            difference: Number((exchangeRate.eldorado_rate - monitorRate.eldorado_rate).toFixed(2)),
            diffPercentage: Number((((exchangeRate.eldorado_rate - monitorRate.eldorado_rate) / exchangeRate.eldorado_rate) * 100).toFixed(2))
          },
          {
            source: 'Syklo',
            monitorRate: monitorRate.syklo_rate,
            exchangeRate: exchangeRate.syklo_rate,
            difference: Number((exchangeRate.syklo_rate - monitorRate.syklo_rate).toFixed(2)),
            diffPercentage: Number((((exchangeRate.syklo_rate - monitorRate.syklo_rate) / exchangeRate.syklo_rate) * 100).toFixed(2))
          },
          {
            source: 'Yadio',
            monitorRate: monitorRate.yadio_rate,
            exchangeRate: exchangeRate.yadio_rate,
            difference: Number((exchangeRate.yadio_rate - monitorRate.yadio_rate).toFixed(2)),
            diffPercentage: Number((((exchangeRate.yadio_rate - monitorRate.yadio_rate) / exchangeRate.yadio_rate) * 100).toFixed(2))
          }
        ];

        return {
          id: monitorRate.id,
          monitorDate: moment(monitorRate.datetime).format('DD/MM/YYYY HH:mm'),
          exchangeDate: moment(exchangeRate.created_at).format('DD/MM/YYYY HH:mm'),
          monitorTotal: monitorRate.total_rate,
          exchangeTotal: exchangeRate.total_rate,
          difference,
          diffPercentage,
          details,
          formattedDate: moment(monitorRate.datetime).format('DD/MM'),
        };
      }));

      // Filtrar elementos nulos y asignar al dataSource
      this.dataSource = tempDataSource.filter(item => item !== null) as ComparisonData[];

      // Filtrar datos para cada fuente
      this.eldoradoDataSource = this.dataSource.map(item => ({
        formattedDate: item.formattedDate,
        monitorDate: item.monitorDate,
        exchangeDate: item.exchangeDate,
        detail: item.details.find(d => d.source === 'Eldorado')
      })).filter(item => item.detail !== undefined);

      this.sykloDataSource = this.dataSource.map(item => ({
        formattedDate: item.formattedDate,
        monitorDate: item.monitorDate,
        exchangeDate: item.exchangeDate,
        detail: item.details.find(d => d.source === 'Syklo')
      })).filter(item => item.detail !== undefined);

      this.yadioDataSource = this.dataSource.map(item => ({
        formattedDate: item.formattedDate,
        monitorDate: item.monitorDate,
        exchangeDate: item.exchangeDate,
        detail: item.details.find(d => d.source === 'Yadio')
      })).filter(item => item.detail !== undefined);

    } catch (err) {
      console.error('Error procesando datos:', err);
    } finally {
      this.loading = false;
    }
  }

  handlePageEvent(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }
}

const ELEMENT_DATA: ComparisonData[] = []; // Esto parece ser mock data, lo removeremos o ajustaremos si es necesario
