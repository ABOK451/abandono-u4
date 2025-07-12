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

  ngOnInit(): void {
    const data = JSON.parse(localStorage.getItem('resultados') || '{}');

    // Cargar datos del backend mejorado
    this.resultados = data.resultados || [];
    this.datosOriginales = data.datos_originales || [];
    this.datosProcesados = data.datos_procesados || [];
    this.resumen = data.resumen || {};
    this.metadatos = data.metadatos || {};
    this.dataList = data.descargable || [];

    // Usar metadatos del backend para categorizar columnas
    if (
      this.metadatos.columnas_categoricas &&
      this.metadatos.columnas_numericas
    ) {
      this.columnasCateg = this.metadatos.columnas_categoricas;
      this.columnasNumericas = this.metadatos.columnas_numericas;
    } else {
      // Fallback: usar datos procesados para obtener columnas
      if (this.datosProcesados.length > 0) {
        this.columnas = Object.keys(this.datosProcesados[0]);
        this.categorizarColumnasFallback();
      }
    }

    // Asignar valores por defecto
    this.selectedXAxis =
      this.columnasCateg.find((col) => col === 'riesgo') ||
      this.columnasCateg.find((col) => col === 'sexo') ||
      this.columnasCateg[0] ||
      'riesgo';

    // Generar datos iniciales
    if (this.chartType === 'bar') {
      this.generarBarChartData();
    }

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

  //================LOGICA DE GRAFICAS============================

  private categorizarColumnasFallback(): void {
    // Fallback en caso de que no vengan los metadatos
    const categoricosForzados = [
      'riesgo',
      'abandona',
      'sexo',
      'rendimiento',
      'trabajo',
    ];
    const numericosForzados = ['edad', 'promedio', 'faltas'];

    this.columnasCateg = this.columnas.filter(
      (col) =>
        categoricosForzados.includes(col) ||
        col === 'nombre' ||
        (this.datosProcesados.length > 0 &&
          this.datosProcesados.some((d) => typeof d[col] === 'string'))
    );

    this.columnasNumericas = this.columnas.filter(
      (col) =>
        numericosForzados.includes(col) ||
        (this.datosProcesados.length > 0 &&
          this.datosProcesados.every((d) => typeof d[col] === 'number'))
    );
  }

  getColumnDisplayName(column: string): string {
    // Usar mapeo de nombres del backend si está disponible
    if (this.metadatos.mapeo_nombres && this.metadatos.mapeo_nombres[column]) {
      return this.metadatos.mapeo_nombres[column];
    }

    // Mapeo fallback
    const displayNames: { [key: string]: string } = {
      edad: 'Edad',
      sexo: 'Sexo',
      promedio: 'Promedio Escolar',
      rendimiento: 'Rendimiento Académico',
      faltas: 'Faltas',
      trabajo: 'Trabaja',
      nivel_socioeconomico: 'Nivel Socioeconómico',
      apoyo_familiar: 'Apoyo Familiar',
      internet: 'Acceso a Internet',
      problemas_emocionales: 'Problemas Emocionales',
      motivacion: 'Motivación',
      abandono_pensado: 'Pensó en Abandonar',
      actividades: 'Actividades Extracurriculares',
      calidad_enseñanza: 'Calidad de Enseñanza',
      transporte: 'Problemas de Transporte',
      riesgo: 'Nivel de Riesgo',
      abandona: 'Abandona',
    };

    return displayNames[column] || column;
  }

  onChartTypeChange(): void {
    if (this.chartType === 'pie') {
      this.generarPieDataPorCategoriaYCategoriaRiesgo();
    } else if (this.chartType === 'bar') {
      this.generarDistribucionPorCategoria();
    }
  }

  onXAxisChange() {
    if (this.chartType === 'pie') {
      this.generarPieDataPorCategoriaYCategoriaRiesgo();
    } else if (this.chartType === 'bar') {
      this.generarDistribucionPorCategoria();
    }
  }

  generarBarChartData(): void {
    if (
      !this.selectedXAxis ||
      !this.selectedYAxis ||
      this.datosOriginales.length === 0 ||
      this.datosProcesados.length === 0
    ) {
      this.barChartData = [];
      return;
    }

    console.log(
      'Generando gráfica:',
      this.selectedXAxis,
      'vs',
      this.selectedYAxis
    );

    const conteos = new Map<string, number>();

    for (let i = 0; i < this.datosOriginales.length; i++) {
      const original = this.datosOriginales[i];
      const procesado = this.datosProcesados[i];

      const xVal = original[this.selectedXAxis]?.toString() || 'Sin datos';
      const yVal = procesado[this.selectedYAxis]?.toString() || 'Sin datos';

      const key = `${xVal} | ${yVal}`;

      conteos.set(key, (conteos.get(key) || 0) + 1);
    }

    // Convertir a formato ngx-charts con conteos
    this.barChartData = Array.from(conteos.entries()).map(([key, count]) => {
      return { name: key, value: count };
    });

    // Ordenar por valor descendente para mejor visualización
    this.barChartData.sort((a, b) => b.value - a.value);

    console.log('Datos generados:', this.barChartData);
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

    // Opcional: ordenar para que se vea ordenado
    this.pieData.sort((a, b) => b.value - a.value);

    console.log('Datos pie por categoría y riesgo:', this.pieData);
  }
}
