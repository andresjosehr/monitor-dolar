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
    DecimalPipe
  ],
  template: `
    <h2 mat-dialog-title>Historial de Comparación</h2>
    <mat-dialog-content>
      <div *ngIf="loading" class="spinner-container">
        <mat-spinner></mat-spinner>
      </div>

      <table *ngIf="!loading" mat-table [dataSource]="dataSource" multiTemplateDataRows class="mat-elevation-z8">
        <!-- Columna Monitor Total -->
        <ng-container matColumnDef="monitorTotal">
          <th mat-header-cell *matHeaderCellDef>Monitor Total</th>
          <td mat-cell *matCellDef="let element">{{element.monitorTotal | number:'1.2-2'}}</td>
        </ng-container>

        <!-- Columna Exchange Total -->
        <ng-container matColumnDef="exchangeTotal">
          <th mat-header-cell *matHeaderCellDef>Exchange Total</th>
          <td mat-cell *matCellDef="let element">{{element.exchangeTotal | number:'1.2-2'}}</td>
        </ng-container>

        <!-- Columna Diferencia -->
        <ng-container matColumnDef="difference">
          <th mat-header-cell *matHeaderCellDef>Diferencia</th>
          <td mat-cell *matCellDef="let element" [ngClass]="{'negative': element.difference < 0, 'positive': element.difference > 0}">
            {{element.difference | number:'1.2-2'}} ({{element.diffPercentage | number:'1.2-2'}}%)
          </td>
        </ng-container>

        <!-- Columna de Detalles Expandidos -->
        <ng-container matColumnDef="expandedDetail">
          <td mat-cell *matCellDef="let element" [attr.colspan]="displayedColumns.length">
            <div class="example-element-detail"
                [@detailExpand]="element == expandedElement ? 'expanded' : 'collapsed'">
              <div class="inner-table">
                <div class="date-row">
                  <div>Monitor: {{element.monitorDate}}</div>
                  <div>Exchange: {{element.exchangeDate}}</div>
                </div>
                <table mat-table [dataSource]="element.details">
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
                    <td mat-cell *matCellDef="let detail" [ngClass]="{'negative': detail.difference < 0, 'positive': detail.difference > 0}">
                      {{detail.difference | number:'1.2-2'}} ({{detail.diffPercentage | number:'1.2-2'}}%)
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="detailColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: detailColumns;"></tr>
                </table>
              </div>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let element; columns: displayedColumns;"
            class="example-element-row"
            [class.example-expanded-row]="expandedElement === element"
            (click)="expandedElement = expandedElement === element ? null : element">
        </tr>
        <tr mat-row *matRowDef="let row; columns: ['expandedDetail']" class="example-detail-row"></tr>

      </table>

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
    table {
      width: 100%;
    }

    tr.example-detail-row {
      height: 0;
    }

    tr.example-element-row:not(.example-expanded-row):hover {
      background: whitesmoke;
    }

    tr.example-element-row:not(.example-expanded-row):active {
      background: #efefef;
    }

    .example-element-row td {
      border-bottom-width: 0;
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

    .date-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-weight: bold;
    }

    .negative {
      color: #f44336;
    }

    .positive {
      color: #4caf50;
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
  displayedColumns: string[] = ['monitorTotal', 'exchangeTotal', 'difference'];
  detailColumns: string[] = ['source', 'monitorRate', 'exchangeRate', 'difference'];
  expandedElement: ComparisonData | null = null;
  dataSource: ComparisonData[] = [];

  // Paginación
  pageSize = 10;
  pageIndex = 0;
  totalRecords = 0;
  loading = true;

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
          details
        };
      }));

      // Filtrar elementos nulos y asignar al dataSource
      this.dataSource = tempDataSource.filter(item => item !== null) as ComparisonData[];

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
