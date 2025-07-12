import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-result',
  standalone: false,
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css'],
})
export class ResultComponent implements OnInit {
  activeTab: 'data' | 'visualizations' = 'data';
  chartType: string = 'pie';
  selectedXAxis: string = '';
  selectedYAxis: string = '';

  columnas: string[] = [];
  columnasNumericas: string[] = [];
  columnasCateg: string[] = [];

  resultados: any[] = [];
  datosOriginales: any[] = [];
  datosProcesados: any[] = [];
  resumen: any;
  metadatos: any = {};
  dataList: any[] = [];

  // Datos para ngx-charts
  view: [number, number] = [1050, 300];
  pieData = [
    { name: 'En riesgo', value: 0 },
    { name: 'Sin riesgo', value: 0 },
  ];
  barChartData: any[] = [];
  bubbleChartData: any[] = [];

  ngOnInit(): void {
    const data = JSON.parse(localStorage.getItem('resultados') || '{}');

    // Cargar datos del backend mejorado
    this.resultados = data.resultados || [];
    this.datosOriginales = data.datos_originales || [];
    this.datosProcesados = data.datos_procesados || [];
    this.resumen = data.resumen || {};
    this.metadatos = data.metadatos || {};
    this.dataList = data.descargable || [];

    // Procesar columnas basándose en los datos reales
    this.procesarColumnas();

    // Asignar valores por defecto - usar la primera columna categórica útil
    this.selectedXAxis = this.columnasCateg[0] || '';

    // Para scatter plot, usar variables numéricas por defecto
    if (this.chartType === 'scatter') {
      this.selectedXAxis = this.columnasNumericas[0] || '';
      this.selectedYAxis =
        this.columnasNumericas[1] || this.columnasNumericas[0] || '';
    }

    // Generar datos iniciales
    this.updateChartData();

    // Configurar gráfica de pastel
    const enRiesgo = this.resumen?.en_riesgo || 0;
    const sinRiesgo = this.resumen?.sin_riesgo || 0;

    this.pieData = [
      { name: 'En riesgo', value: enRiesgo },
      { name: 'Sin riesgo', value: sinRiesgo },
    ];

    console.log('Datos cargados:', {
      columnas_categoricas: this.columnasCateg,
      columnas_numericas: this.columnasNumericas,
      eje_x: this.selectedXAxis,
      eje_y: this.selectedYAxis,
    });
  }

  private procesarColumnas(): void {
    if (this.datosOriginales.length === 0) return;

    // Obtener todas las columnas
    const todasLasColumnas = Object.keys(this.datosOriginales[0]);

    // Definir columnas que sabemos que son numéricas
    const columnasNumericas = [
      '¿Cuál es tu edad?',
      '¿Cuál fue tu promedio escolar en el último ciclo?',
      '¿Cuántas faltas acumulaste en el último mes?',
      'edad',
      'promedio',
      'faltas',
    ];

    // Filtrar columnas numéricas que existen en los datos
    this.columnasNumericas = todasLasColumnas.filter((col) => {
      // Verificar si la columna está en nuestra lista de numéricas conocidas
      const esNumericaConocida = columnasNumericas.some(
        (numCol) => col.includes(numCol) || numCol.includes(col)
      );

      if (esNumericaConocida) return true;

      // También verificar si todos los valores son numéricos
      return this.datosOriginales.every((fila) => {
        const valor = fila[col];
        return (
          valor === null ||
          valor === undefined ||
          valor === '' ||
          !isNaN(Number(valor))
        );
      });
    });

    // Columnas que NO queremos mostrar en las visualizaciones
    const columnasExcluidas = [
      'Marca temporal',
      'Nombre',
      'nombre',
      'riesgo', // Esta ya está implícita en todas las visualizaciones
      'abandona', // Es redundante con riesgo
      'timestamp',
    ];

    // Las columnas categóricas son todas las demás, excluyendo las numéricas y las excluidas
    this.columnasCateg = todasLasColumnas.filter((col) => {
      return (
        !this.columnasNumericas.includes(col) &&
        !columnasExcluidas.some(
          (excluida) => col.includes(excluida) || excluida.includes(col)
        )
      );
    });

    console.log('Columnas procesadas:', {
      numericas: this.columnasNumericas,
      categoricas: this.columnasCateg,
      excluidas: columnasExcluidas,
    });
  }

  private updateChartData(): void {
    switch (this.chartType) {
      case 'pie':
        this.generarPieDataPorCategoriaYCategoriaRiesgo();
        break;
      case 'bar':
        this.generarDistribucionPorCategoria();
        break;
      case 'scatter':
        this.generarBubbleChartData();
        break;
      default:
        break;
    }
  }

  exportarCSV(): void {
    if (this.resultados.length === 0) return;

    const csvContent = [
      Object.keys(this.resultados[0]).join(','), // encabezado
      ...this.resultados.map((r) => Object.values(r).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'resultados.csv';
    link.click();
  }

  getColumnDisplayName(column: string): string {
  return column
    .replace(/_/g, ' ')                 
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
  }

  onChartTypeChange(): void {
    // Si cambia a scatter, asegurar que ambos ejes sean numéricos
    if (this.chartType === 'scatter') {
      if (!this.columnasNumericas.includes(this.selectedXAxis)) {
        this.selectedXAxis = this.columnasNumericas[0] || '';
      }
      if (
        !this.selectedYAxis ||
        !this.columnasNumericas.includes(this.selectedYAxis)
      ) {
        this.selectedYAxis =
          this.columnasNumericas[1] || this.columnasNumericas[0] || '';
      }
    } else {
      // Para otros tipos de gráfico, usar columnas categóricas
      if (!this.columnasCateg.includes(this.selectedXAxis)) {
        this.selectedXAxis = this.columnasCateg[0] || '';
      }
    }

    this.updateChartData();
  }

  onXAxisChange(): void {
    this.updateChartData();
  }

  private obtenerValorNumerico(fila: any, columna: string): number | null {
    const valor = fila[columna];

    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    const numeroConvertido = Number(valor);
    return isNaN(numeroConvertido) ? null : numeroConvertido;
  }

  generarDistribucionPorCategoria(): void {
    if (!this.selectedXAxis || this.datosOriginales.length === 0) {
      this.barChartData = [];
      return;
    }

    const conteo = new Map<string, { enRiesgo: number; sinRiesgo: number }>();

    for (const fila of this.datosOriginales) {
      const categoria = fila[this.selectedXAxis]?.toString() || 'Sin datos';
      const riesgo = fila['riesgo'] === 'En riesgo de abandono';

      if (!conteo.has(categoria)) {
        conteo.set(categoria, { enRiesgo: 0, sinRiesgo: 0 });
      }

      if (riesgo) {
        conteo.get(categoria)!.enRiesgo++;
      } else {
        conteo.get(categoria)!.sinRiesgo++;
      }
    }

    this.barChartData = [];

    for (const [categoria, { enRiesgo, sinRiesgo }] of conteo.entries()) {
      this.barChartData.push({
        name: `${categoria} | En riesgo`,
        value: enRiesgo,
      });
      this.barChartData.push({
        name: `${categoria} | Sin riesgo`,
        value: sinRiesgo,
      });
    }

    console.log('Distribución generada:', this.barChartData);
  }

  generarPieDataPorCategoriaYCategoriaRiesgo(): void {
    if (!this.selectedXAxis || this.datosOriginales.length === 0) {
      this.pieData = [];
      return;
    }

    const conteo = new Map<string, number>();

    for (const fila of this.datosOriginales) {
      const categoria = fila[this.selectedXAxis]?.toString() || 'Sin datos';
      const riesgo =
        fila['riesgo'] === 'En riesgo de abandono' ? 'En riesgo' : 'Sin riesgo';
      const key = `${categoria} | ${riesgo}`;

      conteo.set(key, (conteo.get(key) || 0) + 1);
    }

    this.pieData = [];

    for (const [key, cantidad] of conteo.entries()) {
      this.pieData.push({ name: key, value: cantidad });
    }

    // Ordenar para que se vea ordenado
    this.pieData.sort((a, b) => b.value - a.value);

    console.log('Datos pie por categoría y riesgo:', this.pieData);
  }

  generarBubbleChartData(): void {
    if (
      !this.selectedXAxis ||
      !this.selectedYAxis ||
      this.datosOriginales.length === 0
    ) {
      this.bubbleChartData = [];
      return;
    }

    // VALIDACIÓN: Verificar que ambas variables sean numéricas
    if (
      !this.columnasNumericas.includes(this.selectedXAxis) ||
      !this.columnasNumericas.includes(this.selectedYAxis)
    ) {
      console.warn('Ambas variables deben ser numéricas para el scatter plot');
      this.bubbleChartData = [];
      return;
    }

    console.log(
      'Generando scatter plot para:',
      this.selectedXAxis,
      'vs',
      this.selectedYAxis
    );

    const puntos = [];

    for (let i = 0; i < this.datosOriginales.length; i++) {
      const fila = this.datosOriginales[i];

      const xVal = this.obtenerValorNumerico(fila, this.selectedXAxis);
      const yVal = this.obtenerValorNumerico(fila, this.selectedYAxis);

      // Solo agregar puntos con valores numéricos válidos
      if (xVal !== null && yVal !== null) {
        // Determinar el riesgo
        let riesgo = 'Sin riesgo';
        if (
          fila['riesgo'] === 'En riesgo de abandono' ||
          fila['riesgo'] === 'En riesgo' ||
          fila['abandona'] === 'Sí' ||
          fila['abandona'] === true
        ) {
          riesgo = 'En riesgo';
        }

        const nombre = fila['Nombre'] || fila['nombre'] || `Punto ${i + 1}`;

        puntos.push({
          name: nombre,
          x: xVal,
          y: yVal,
          r: 12, // Radio fijo
          riesgo: riesgo,
        });
      }
    }

    console.log('Puntos generados:', puntos);

    if (puntos.length === 0) {
      console.warn('No se generaron puntos válidos. Verifica los datos.');
      this.bubbleChartData = [];
      return;
    }

    // Agrupar puntos por riesgo
    const puntosEnRiesgo = puntos.filter((p) => p.riesgo === 'En riesgo');
    const puntosSinRiesgo = puntos.filter((p) => p.riesgo === 'Sin riesgo');

    this.bubbleChartData = [];

    if (puntosEnRiesgo.length > 0) {
      this.bubbleChartData.push({
        name: 'En riesgo',
        series: puntosEnRiesgo.map((p) => ({
          name: p.name,
          x: p.x,
          y: p.y,
          r: p.r,
        })),
      });
    }

    if (puntosSinRiesgo.length > 0) {
      this.bubbleChartData.push({
        name: 'Sin riesgo',
        series: puntosSinRiesgo.map((p) => ({
          name: p.name,
          x: p.x,
          y: p.y,
          r: p.r,
        })),
      });
    }

    console.log('Datos finales para bubble chart:', this.bubbleChartData);
  }
}
