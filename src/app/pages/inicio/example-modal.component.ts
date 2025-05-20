import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { animate, state, style, transition, trigger } from '@angular/animations';

interface ExampleData {
  name: string;
  value: number;
  details: { date: string; amount: number }[];
}

@Component({
  selector: 'app-example-modal',
  standalone: true,
  imports: [
    MatTableModule,
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Detalles de Comparación</h2>
    <mat-dialog-content>
      <table mat-table [dataSource]="dataSource" multiTemplateDataRows class="mat-elevation-z8">
        <!-- Columna Nombre -->
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let element">{{element.name}}</td>
        </ng-container>

        <!-- Columna Valor -->
        <ng-container matColumnDef="value">
          <th mat-header-cell *matHeaderCellDef>Valor</th>
          <td mat-cell *matCellDef="let element">{{element.value}}</td>
        </ng-container>

        <!-- Columna de Detalles Expandidos -->
        <ng-container matColumnDef="expandedDetail">
          <td mat-cell *matCellDef="let element" [attr.colspan]="displayedColumns.length">
            <div class="example-element-detail"
                [@detailExpand]="element == expandedElement ? 'expanded' : 'collapsed'">
              <div class="inner-table">
                <h4>Detalles históricos</h4>
                <table mat-table [dataSource]="element.details">
                  <ng-container matColumnDef="date">
                    <th mat-header-cell *matHeaderCellDef>Fecha</th>
                    <td mat-cell *matCellDef="let detail">{{detail.date}}</td>
                  </ng-container>

                  <ng-container matColumnDef="amount">
                    <th mat-header-cell *matHeaderCellDef>Cantidad</th>
                    <td mat-cell *matCellDef="let detail">{{detail.amount}}</td>
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
  `],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ExampleModalComponent {
  displayedColumns: string[] = ['name', 'value'];
  detailColumns: string[] = ['date', 'amount'];
  expandedElement: ExampleData | null = null;

  dataSource = [
    {
      name: 'Monitor Dólar Today',
      value: 35.62,
      details: [
        { date: '2024-03-01', amount: 35.62 },
        { date: '2024-02-29', amount: 35.45 },
        { date: '2024-02-28', amount: 35.30 }
      ]
    },
    {
      name: 'Monitor BCV',
      value: 35.48,
      details: [
        { date: '2024-03-01', amount: 35.48 },
        { date: '2024-02-29', amount: 35.40 },
        { date: '2024-02-28', amount: 35.25 }
      ]
    },
    {
      name: 'Monitor Binance',
      value: 35.55,
      details: [
        { date: '2024-03-01', amount: 35.55 },
        { date: '2024-02-29', amount: 35.42 },
        { date: '2024-02-28', amount: 35.28 }
      ]
    }
  ];

  constructor(
    public dialogRef: MatDialogRef<ExampleModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
}
