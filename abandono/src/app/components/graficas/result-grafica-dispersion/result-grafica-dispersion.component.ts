import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-result-grafica-dispersion',
  standalone: false,
  templateUrl: './result-grafica-dispersion.component.html',
  styleUrl: './result-grafica-dispersion.component.css',
})
export class ResultGraficaDispersionComponent {
  @Input() view: [number, number] = [700, 400];
  bubbleChartData: any[] = [];

  // Escalas calculadas
  xScaleMin = 0;
  xScaleMax = 100;
  yScaleMin = 0;
  yScaleMax = 100;

  colorScheme = 'cool';

  varianzaExplicada: number[] = [];
  varianzaTotal: number = 0;

  get hasValidData(): boolean {
    return this.bubbleChartData.length > 0;
  }

  onSelect(event: any): void {
    console.log('Punto seleccionado:', event);
  }

  ngOnInit() {
    const stored = JSON.parse(localStorage.getItem('resultados') || '{}');
    const datosPCA = stored.pca_visualization?.datos_pca || [];

    this.varianzaExplicada = stored.pca_visualization?.varianza_explicada || [];
    this.varianzaTotal =
      stored.pca_visualization?.varianza_total_explicada || 0;

    this.bubbleChartData = this.convertirDatosPCA(datosPCA);
    this.calcularEscalas();
  }

  convertirDatosPCA(datos: any[]): any[] {
    const puntosPorCluster: { [key: string]: any[] } = {};

    for (const punto of datos) {
      const cluster = punto.cluster;
      if (!puntosPorCluster[cluster]) puntosPorCluster[cluster] = [];

      puntosPorCluster[cluster].push({
        name: punto.nombre || `Punto`,
        x: punto.x,
        y: punto.y,
        r: 12,
      });
    }

    return Object.keys(puntosPorCluster).map((cluster) => ({
      name: cluster === '1' ? 'Sin riesgo' : 'En riesgo',
      series: puntosPorCluster[cluster],
    }));
  }

  calcularEscalas() {
    const allX = [];
    const allY = [];

    for (const serie of this.bubbleChartData) {
      for (const punto of serie.series) {
        allX.push(punto.x);
        allY.push(punto.y);
      }
    }

    if (allX.length && allY.length) {
      const xMin = Math.min(...allX);
      const xMax = Math.max(...allX);
      const yMin = Math.min(...allY);
      const yMax = Math.max(...allY);

      const xPadding = (xMax - xMin) * 0.1;
      const yPadding = (yMax - yMin) * 0.1;

      this.xScaleMin = xMin - xPadding;
      this.xScaleMax = xMax + xPadding;
      this.yScaleMin = yMin - yPadding;
      this.yScaleMax = yMax + yPadding;
    }
  }
}
