import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatTabsModule} from '@angular/material/tabs';
import { BinanceService } from '../../services/binance.service';

@Component({
  selector: 'app-currency-calculator',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './currency-calculator.component.html',
  styles: [
    `
    .calculator-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }

    mat-form-field {
      width: 100%;
    }
    `
  ]
})
export class CurrencyCalculatorComponent implements OnInit {
  @Input() monitorRate: number = 0;
  @Input() bcvRate: number = 0;
  averageRate: number = 0;

  // Valores numéricos para cálculos
  bsAmount: number | null = null;
  monitorAmount: number | null = null;
  bcvAmount: number | null = null;
  averageAmount: number | null = null;
  btb_bcvAmount: number | null = null;
  btb_binanceAmount: number | null = null;

  // Valores para mostrar en los inputs
  displayBsAmount: string = '';
  displayMonitorAmount: string = '';
  displayBcvAmount: string = '';
  displayAverageAmount: string = '';

  btb_displayBcvAmount: string = '';
  btb_displayBinanceAmount: string = '';

  constructor(private binanceService: BinanceService) {}

  ngOnInit() {

  }

  // Listen when this.monitorRate and this.bcvRate changes and calculate the average rate after that
  ngOnChanges(changes: SimpleChanges) {
    if (changes['monitorRate'] || changes['bcvRate']) {
      this.calculateAverageRate();
    }
  }

  private calculateAverageRate() {
    this.averageRate = (this.monitorRate + this.bcvRate) / 2;
  }

  // Métodos para formatear números con separadores de miles
  formatNumber(value: number | null): string {
    if (value === null) return '';

    // Convertir a string y separar parte entera y decimal
    const parts = value.toString().split('.');

    // Formatear parte entera con separadores de miles
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Devolver el número formateado (con decimal si existe)
    return parts.length > 1 ? parts.join(',') : parts[0];
  }

  // Métodos para convertir de string formateado a número
  parseFormattedNumber(value: string): number | null {
    if (!value) return null;

    // Eliminar puntos y reemplazar coma por punto para operaciones
    const numericValue = value.replace(/\./g, '').replace(',', '.');
    return isNaN(parseFloat(numericValue)) ? null : parseFloat(numericValue);
  }

  // Handlers para el input de Bs
  onBsInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const cursorPosition = inputElement.selectionStart;
    const inputValue = inputElement.value;

    // Eliminar caracteres no numéricos excepto puntos y comas
    let cleanValue = inputValue.replace(/[^\d.,]/g, '');

    // Permitir solo una coma
    const commaIndex = cleanValue.indexOf(',');
    if (commaIndex !== -1) {
      cleanValue = cleanValue.substring(0, commaIndex + 1) +
                   cleanValue.substring(commaIndex + 1).replace(/,/g, '');
    }

    // Actualizar valor numérico
    this.bsAmount = this.parseFormattedNumber(cleanValue);

    // Mantener la entrada del usuario si contiene una coma
    if (cleanValue.includes(',')) {
      this.displayBsAmount = cleanValue;
    }
    // Solo actualizar el formato si hay valor y supera 999 y no tiene coma
    else if (this.bsAmount && this.bsAmount >= 1000) {
      const formatted = this.formatNumber(this.bsAmount);

      // Solo actualizar si el formato es diferente
      if (formatted !== inputValue) {
        this.displayBsAmount = formatted;

        // Ajustar la posición del cursor
        setTimeout(() => {
          // Calcular nueva posición del cursor
          let newPosition = cursorPosition || 0;
          const lengthDiff = formatted.length - inputValue.length;
          newPosition += lengthDiff;

          inputElement.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    } else {
      this.displayBsAmount = cleanValue;
    }

    this.updateOtherAmounts('bs');
  }

  onBsBlur() {
    if (this.bsAmount !== null) {
      this.displayBsAmount = this.formatNumber(this.bsAmount);
    }
  }

  // Handlers para el input de Monitor
  onMonitorInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const cursorPosition = inputElement.selectionStart;
    const inputValue = inputElement.value;

    let cleanValue = inputValue.replace(/[^\d.,]/g, '');
    const commaIndex = cleanValue.indexOf(',');
    if (commaIndex !== -1) {
      cleanValue = cleanValue.substring(0, commaIndex + 1) +
                   cleanValue.substring(commaIndex + 1).replace(/,/g, '');
    }

    this.monitorAmount = this.parseFormattedNumber(cleanValue);

    // Mantener la entrada del usuario si contiene una coma
    if (cleanValue.includes(',')) {
      this.displayMonitorAmount = cleanValue;
    }
    // Solo actualizar el formato si hay valor y supera 999 y no tiene coma
    else if (this.monitorAmount && this.monitorAmount >= 1000) {
      const formatted = this.formatNumber(this.monitorAmount);
      if (formatted !== inputValue) {
        this.displayMonitorAmount = formatted;
        setTimeout(() => {
          let newPosition = cursorPosition || 0;
          const lengthDiff = formatted.length - inputValue.length;
          newPosition += lengthDiff;
          inputElement.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    } else {
      this.displayMonitorAmount = cleanValue;
    }

    this.updateOtherAmounts('monitor');
  }

  onMonitorBlur() {
    if (this.monitorAmount !== null) {
      this.displayMonitorAmount = this.formatNumber(this.monitorAmount);
    }
  }

  // Handlers para el input de BCV
  onBcvInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const cursorPosition = inputElement.selectionStart;
    const inputValue = inputElement.value;

    let cleanValue = inputValue.replace(/[^\d.,]/g, '');
    const commaIndex = cleanValue.indexOf(',');
    if (commaIndex !== -1) {
      cleanValue = cleanValue.substring(0, commaIndex + 1) +
                   cleanValue.substring(commaIndex + 1).replace(/,/g, '');
    }

    this.bcvAmount = this.parseFormattedNumber(cleanValue);

    // Mantener la entrada del usuario si contiene una coma
    if (cleanValue.includes(',')) {
      this.displayBcvAmount = cleanValue;
    }
    // Solo actualizar el formato si hay valor y supera 999 y no tiene coma
    else if (this.bcvAmount && this.bcvAmount >= 1000) {
      const formatted = this.formatNumber(this.bcvAmount);
      if (formatted !== inputValue) {
        this.displayBcvAmount = formatted;
        setTimeout(() => {
          let newPosition = cursorPosition || 0;
          const lengthDiff = formatted.length - inputValue.length;
          newPosition += lengthDiff;
          inputElement.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    } else {
      this.displayBcvAmount = cleanValue;
    }

    this.updateOtherAmounts('bcv');
  }

  async btb_onBcvInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const cursorPosition = inputElement.selectionStart;
    const inputValue = parseFloat(inputElement.value);

    const vesValue = inputValue * this.bcvRate;



    const prices = await this.binanceService.getOffersApi(vesValue);
    const priceBinance = prices[0].price;

    const binanceAmount = parseFloat((vesValue / priceBinance).toFixed(2));

    this.btb_displayBinanceAmount = this.formatNumber(binanceAmount);
  }

  onBinanceBlur() {
    if (this.btb_displayBinanceAmount !== null) {
      this.btb_displayBinanceAmount = this.formatNumber(Number(this.btb_displayBinanceAmount));
    }
  }

  btb_onBinanceInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const cursorPosition = inputElement.selectionStart;
    const inputValue = inputElement.value
  }

  onBcvBlur() {
    if (this.bcvAmount !== null) {
      this.displayBcvAmount = this.formatNumber(this.bcvAmount);
    }
  }

  // Handlers para el input de Promedio
  onAverageInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const cursorPosition = inputElement.selectionStart;
    const inputValue = inputElement.value;

    let cleanValue = inputValue.replace(/[^\d.,]/g, '');
    const commaIndex = cleanValue.indexOf(',');
    if (commaIndex !== -1) {
      cleanValue = cleanValue.substring(0, commaIndex + 1) +
                   cleanValue.substring(commaIndex + 1).replace(/,/g, '');
    }

    this.averageAmount = this.parseFormattedNumber(cleanValue);

    // Mantener la entrada del usuario si contiene una coma
    if (cleanValue.includes(',')) {
      this.displayAverageAmount = cleanValue;
    }
    // Solo actualizar el formato si hay valor y supera 999 y no tiene coma
    else if (this.averageAmount && this.averageAmount >= 1000) {
      const formatted = this.formatNumber(this.averageAmount);
      if (formatted !== inputValue) {
        this.displayAverageAmount = formatted;
        setTimeout(() => {
          let newPosition = cursorPosition || 0;
          const lengthDiff = formatted.length - inputValue.length;
          newPosition += lengthDiff;
          inputElement.setSelectionRange(newPosition, newPosition);
        }, 0);
      }
    } else {
      this.displayAverageAmount = cleanValue;
    }

    this.updateOtherAmounts('average');
  }

  onAverageBlur() {
    if (this.averageAmount !== null) {
      this.displayAverageAmount = this.formatNumber(this.averageAmount);
    }
  }

  // Métodos para actualizar los demás valores basados en el campo que cambió
  updateOtherAmounts(source: string) {
    switch (source) {
      case 'bs':
        if (this.bsAmount === null) {
          // Si el campo Bs está vacío, limpiar todos los demás campos
          this.monitorAmount = null;
          this.bcvAmount = null;
          this.averageAmount = null;
          this.displayMonitorAmount = '';
          this.displayBcvAmount = '';
          this.displayAverageAmount = '';
          return;
        }

        this.monitorAmount = this.parseNumber(this.bsAmount / this.monitorRate);
        this.bcvAmount = this.parseNumber(this.bsAmount / this.bcvRate);
        this.averageAmount = this.parseNumber(this.bsAmount / this.averageRate);

        // Actualizar todos los displays excepto el de Bs
        this.displayMonitorAmount = this.formatNumber(this.monitorAmount);
        this.displayBcvAmount = this.formatNumber(this.bcvAmount);
        this.displayAverageAmount = this.formatNumber(this.averageAmount);
        break;

      case 'monitor':
        if (this.monitorAmount === null) {
          // Si el campo Monitor está vacío, limpiar todos los demás campos
          this.bsAmount = null;
          this.bcvAmount = null;
          this.averageAmount = null;
          this.displayBsAmount = '';
          this.displayBcvAmount = '';
          this.displayAverageAmount = '';
          return;
        }

        this.bsAmount = this.parseNumber(this.monitorAmount * this.monitorRate);
        this.bcvAmount = this.parseNumber(this.bsAmount / this.bcvRate);
        this.averageAmount = this.parseNumber(this.bsAmount / this.averageRate);

        // Actualizar todos los displays excepto el de Monitor
        this.displayBsAmount = this.formatNumber(this.bsAmount);
        this.displayBcvAmount = this.formatNumber(this.bcvAmount);
        this.displayAverageAmount = this.formatNumber(this.averageAmount);
        break;

      case 'bcv':
        if (this.bcvAmount === null) {
          // Si el campo BCV está vacío, limpiar todos los demás campos
          this.bsAmount = null;
          this.monitorAmount = null;
          this.averageAmount = null;
          this.displayBsAmount = '';
          this.displayMonitorAmount = '';
          this.displayAverageAmount = '';
          return;
        }

        this.bsAmount = this.parseNumber(this.bcvAmount * this.bcvRate);
        this.monitorAmount = this.parseNumber(this.bsAmount / this.monitorRate);
        this.averageAmount = this.parseNumber(this.bsAmount / this.averageRate);

        // Actualizar todos los displays excepto el de BCV
        this.displayBsAmount = this.formatNumber(this.bsAmount);
        this.displayMonitorAmount = this.formatNumber(this.monitorAmount);
        this.displayAverageAmount = this.formatNumber(this.averageAmount);
        break;

      case 'average':
        if (this.averageAmount === null) {
          // Si el campo Promedio está vacío, limpiar todos los demás campos
          this.bsAmount = null;
          this.monitorAmount = null;
          this.bcvAmount = null;
          this.displayBsAmount = '';
          this.displayMonitorAmount = '';
          this.displayBcvAmount = '';
          return;
        }

        this.bsAmount = this.parseNumber(this.averageAmount * this.averageRate);
        this.monitorAmount = this.parseNumber(this.bsAmount / this.monitorRate);
        this.bcvAmount = this.parseNumber(this.bsAmount / this.bcvRate);

        // Actualizar todos los displays excepto el de Promedio
        this.displayBsAmount = this.formatNumber(this.bsAmount);
        this.displayMonitorAmount = this.formatNumber(this.monitorAmount);
        this.displayBcvAmount = this.formatNumber(this.bcvAmount);
        break;
    }
  }

  parseNumber(value: number | string) {
    return parseFloat(Number(value).toFixed(2));
  }
}
