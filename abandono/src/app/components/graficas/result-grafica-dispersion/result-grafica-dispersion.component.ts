import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-result-grafica-dispersion',
  standalone: false,
  templateUrl: './result-grafica-dispersion.component.html',
  styleUrl: './result-grafica-dispersion.component.css',
})
export class ResultGraficaDispersionComponent {
  @Input() bubbleData: any[] = [];
  @Input() view: [number, number] = [700, 400];
  @Input() xAxisLabel: string = 'Eje X';
  @Input() yAxisLabel: string = 'Eje Y';
  
  // Option 1: Make them required with default values
  @Input() xScaleMin: number = 0;
  @Input() xScaleMax: number = 100;
  @Input() yScaleMin: number = 0;
  @Input() yScaleMax: number = 100;

  // Fix the color scheme - use a predefined scheme name
  colorScheme = 'cool';

  // Alternative: Define as proper Color object
  // colorScheme = {
  //   name: 'custom',
  //   selectable: true,
  //   group: 'Ordinal',
  //   domain: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
  // };

  onSelect(event: any) {
    console.log('Punto seleccionado:', event);
  }

  // Getter para verificar si hay datos válidos
  get hasValidData(): boolean {
    return (
      this.bubbleData &&
      this.bubbleData.length > 0 &&
      this.bubbleData.some(
        (series) => series.series && series.series.length > 0
      )
    );
  }

  // Helper method to calculate scale limits dynamically
  private calculateScaleLimits() {
    if (!this.hasValidData) return;

    const allXValues: number[] = [];
    const allYValues: number[] = [];

    this.bubbleData.forEach(series => {
      series.series?.forEach((point: any) => {
        if (typeof point.x === 'number') allXValues.push(point.x);
        if (typeof point.y === 'number') allYValues.push(point.y);
      });
    });

    if (allXValues.length > 0) {
      const xMin = Math.min(...allXValues);
      const xMax = Math.max(...allXValues);
      const xPadding = (xMax - xMin) * 0.1; // 10% padding
      this.xScaleMin = xMin - xPadding;
      this.xScaleMax = xMax + xPadding;
    }

    if (allYValues.length > 0) {
      const yMin = Math.min(...allYValues);
      const yMax = Math.max(...allYValues);
      const yPadding = (yMax - yMin) * 0.1; // 10% padding
      this.yScaleMin = yMin - yPadding;
      this.yScaleMax = yMax + yPadding;
    }
  }

  ngOnInit() {
    this.calculateScaleLimits();
  }
}