import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { FormGroup, FormBuilder } from '@angular/forms';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-date-range-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule
  ],
  templateUrl: './date-range-selector.component.html',
  styleUrls: ['./date-range-selector.component.scss']
})
export class DateRangeSelectorComponent implements OnInit {
  @Output() dateRangeChanged = new EventEmitter<DateRange>();

  dateRangeForm: FormGroup;

  // Opciones predefinidas de rangos
  readonly dateRangeOptions = [
    { label: 'Últimos 7 días', days: 7 },
    { label: 'Últimos 30 días', days: 30 },
    { label: 'Últimos 90 días', days: 90 },
    { label: 'Personalizado', days: null }
  ];

  constructor(private fb: FormBuilder) {
    this.dateRangeForm = this.fb.group({
      startDate: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)],
      endDate: [new Date()]
    });
  }

  ngOnInit() {
    // Emitir el rango inicial
    this.emitDateRange();
  }

  // Seleccionar un rango predefinido
  selectDateRange(days: number | null) {
    if (days === null) {
      // No hacer nada para el selector personalizado, solo activar los inputs
      return;
    }

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - days);

    this.dateRangeForm.patchValue({
      startDate,
      endDate
    });

    this.emitDateRange();
  }

  // Emitir el cambio de fechas
  emitDateRange() {
    if (this.dateRangeForm.valid) {
      this.dateRangeChanged.emit({
        startDate: this.dateRangeForm.get('startDate')?.value,
        endDate: this.dateRangeForm.get('endDate')?.value
      });
    }
  }
}
