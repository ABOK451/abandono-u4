import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  filtroRiesgo: 'todos' | 'en_riesgo' | 'sin_riesgo' = 'todos';
  resultadosFiltrados: any[] = [];

  // Variables para el modal de descarga
  showDownloadModal = false;
  downloadConfig = {
    format: 'excel' as 'excel' | 'pdf',
    includeData: true,
    includeCharts: true,
    includeProcessedData: false,
    includeSummary: true,
    selectedVariables: {} as { [key: string]: boolean },
    selectedCharts: {
      pie: true,
      bar: true,
      scatter: true,
    },
  };

  variablesSeleccionadas: { [key: string]: boolean } = {};
  incluirOriginales = true;
  incluirProcesados = false;
  incluirResumen = false;

  mapeoNombres: { [key: string]: string } = {};
  columnasTotales: string[] = [];

  // Datos para ngx-charts
  view: [number, number] = [1050, 300];
  pieData = [
    { name: 'En riesgo', value: 0 },
    { name: 'Sin riesgo', value: 0 },
  ];
  barChartData: any[] = [];
  bubbleChartData: any[] = [];

  modalAbierto = false;
  estudianteSeleccionado: any = null;

  abrirModal(estudiante: any) {
    // Buscar detalle completo por nombre (o por id si tienes)
    const detalleCompleto = this.datosOriginales.find(
      (d) => d.nombre.trim() === estudiante.nombre.trim()
    );

    if (detalleCompleto) {
      this.estudianteSeleccionado = detalleCompleto;
    } else {
      this.estudianteSeleccionado = estudiante; // fallback
    }

    this.modalAbierto = true;
  }

  esSi(valor: any): boolean {
    return (
      String(valor).trim().toLowerCase() === 'sí' ||
      valor === 1 ||
      valor === true
    );
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.estudianteSeleccionado = null;
  }

 estaEnRiesgoPersonalizado(estudiante: any): boolean {
  let condiciones = 0;

  const promedio = parseFloat(estudiante.promedio);
  const faltas = parseInt(estudiante.faltas, 10);

  // 1. Promedio menor a 8.0
  if (!isNaN(promedio) && promedio < 8.0) condiciones++;

  // 2. Faltas 5 o más
  if (!isNaN(faltas) && faltas >= 5) condiciones++;

  // 3. NO está motivado
  if (!this.esSi(estudiante.motivacion)) condiciones++;

  // 4. Ha pensado en abandonar
  if (this.esSi(estudiante.abandono_pensado)) condiciones++;

  // 5. Tiene problemas emocionales
  if (this.esSi(estudiante.problemas_emocionales)) condiciones++;

  // 6. Rendimiento malo o regular
  const rendimiento = estudiante.rendimiento_academico?.toLowerCase();
  if (rendimiento === 'malo' || rendimiento === 'regular') condiciones++;

  // 7. Poco apoyo familiar
  const apoyo = estudiante.apoyo_familiar?.toLowerCase();
  if (apoyo === 'poco' || apoyo === 'nulo') condiciones++;

  // 8. Sin acceso a internet
  if (!this.esSi(estudiante.acceso_internet)) condiciones++;

  // 9. No participa en actividades extracurriculares
  if (!this.esSi(estudiante.actividades_extracurriculares)) condiciones++;

  // 10. Tiene problemas de transporte
  if (this.esSi(estudiante.problemas_transporte)) condiciones++;

  // 11. Trabaja mientras estudia
  if (this.esSi(estudiante.trabajo)) condiciones++;

  // Si cumple al menos 6 de estas señales, se considera en riesgo
  return condiciones >= 6;
}


  ngOnInit(): void {
    const data = JSON.parse(localStorage.getItem('resultados') || '{}');

    const resumenString = localStorage.getItem('resumen');
    if (resumenString) {
      this.resumen = JSON.parse(resumenString);
    }

    // Cargar datos del backend mejorado PRIMERO
    this.resultados = data.resultados || [];
    this.datosOriginales = data.datos_originales || [];
    this.datosProcesados = data.datos_procesados || [];
    this.resumen = data.resumen || {};
    this.metadatos = data.metadatos || {};
    this.dataList = data.descargable || [];

    // AHORA aplicar el filtro cuando ya tenemos los datos
    this.aplicarFiltro();

    this.columnasTotales = [...this.columnasCateg, ...this.columnasNumericas];
    this.columnasTotales.forEach(
      (col) => (this.variablesSeleccionadas[col] = true)
    );

    // Procesar columnas basándose en los datos reales
    this.procesarColumnas();
    this.initializeDownloadConfig();

    // Asignar valores por defecto
    this.selectedXAxis = this.columnasCateg.includes('sexo')
      ? 'sexo'
      : this.columnasCateg[0] || '';

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
      resultados_totales: this.resultados.length,
      resultados_filtrados: this.resultadosFiltrados.length,
    });

    console.log('Datos originales: ', this.datosProcesados);
  }

  aplicarFiltro() {
    console.log('Filtro activo:', this.filtroRiesgo);
    console.log(
      'Riesgos en datos:',
      this.resultados.map((r) => r.riesgo)
    );

    if (this.filtroRiesgo === 'en_riesgo') {
      this.resultadosFiltrados = this.resultados.filter(
        (r) =>
          r.riesgo === 'En riesgo de abandono' ||
          r.riesgo === 'En riesgo' ||
          r.riesgo === 'alto' || // por si hay algún otro valor
          r.riesgo === 'Alto'
      );
    } else if (this.filtroRiesgo === 'sin_riesgo') {
      this.resultadosFiltrados = this.resultados.filter(
        (r) =>
          r.riesgo === 'Sin riesgo' ||
          r.riesgo === 'Bajo' ||
          r.riesgo === 'bajo'
      );
    } else {
      this.resultadosFiltrados = this.resultados;
    }

    console.log('Filtrados:', this.resultadosFiltrados);
  }

  cambiarFiltro(filtro: 'todos' | 'en_riesgo' | 'sin_riesgo') {
    this.filtroRiesgo = filtro;
    this.aplicarFiltro();
  }

  private initializeDownloadConfig(): void {
    // Inicializar variables seleccionadas
    this.columnasTotales.forEach((col) => {
      this.downloadConfig.selectedVariables[col] = true;
    });
  }

  private procesarColumnas(): void {
    if (this.datosOriginales.length === 0) return;

    const todasLasColumnas = Object.keys(this.datosOriginales[0]);

    const columnasNumericas = [
      '¿Cuál es tu edad?',
      '¿Cuál fue tu promedio escolar en el último ciclo?',
      '¿Cuántas faltas acumulaste en el último mes?',
      'edad',
      'promedio',
      'faltas',
    ];

    this.columnasNumericas = todasLasColumnas.filter((col) => {
      const esNumericaConocida = columnasNumericas.some(
        (numCol) => col.includes(numCol) || numCol.includes(col)
      );

      if (esNumericaConocida) return true;

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

    const columnasExcluidas = [
      'Marca temporal',
      'Nombre',
      'nombre',
      'riesgo',
      'abandona',
      'timestamp',
    ];

    this.columnasCateg = todasLasColumnas.filter((col) => {
      return (
        !this.columnasNumericas.includes(col) &&
        !columnasExcluidas.some(
          (excluida) => col.includes(excluida) || excluida.includes(col)
        )
      );
    });

    // Actualizar columnas totales
    this.columnasTotales = [...this.columnasCateg, ...this.columnasNumericas];
  }

  private updateChartData(): void {
    switch (this.chartType) {
      case 'pie':
        this.generarPieDataPorCategoriaYCategoriaRiesgo();
        break;
      case 'bar':
        this.generarDistribucionPorCategoria();
        break;
      default:
        break;
    }
  }

  // Métodos del modal de descarga
  openDownloadModal(): void {
    this.showDownloadModal = true;
  }

  closeDownloadModal(): void {
    this.showDownloadModal = false;
  }

  toggleAllVariables(selected: boolean): void {
    Object.keys(this.downloadConfig.selectedVariables).forEach((key) => {
      this.downloadConfig.selectedVariables[key] = selected;
    });
  }

  toggleAllCharts(selected: boolean): void {
    Object.keys(this.downloadConfig.selectedCharts).forEach((key) => {
      this.downloadConfig.selectedCharts[
        key as keyof typeof this.downloadConfig.selectedCharts
      ] = selected;
    });
  }

  getSelectedVariablesCount(): number {
    return Object.values(this.downloadConfig.selectedVariables).filter(Boolean)
      .length;
  }

  getSelectedChartsCount(): number {
    return Object.values(this.downloadConfig.selectedCharts).filter(Boolean)
      .length;
  }

  async downloadCustomFile(): Promise<void> {
    try {
      if (this.downloadConfig.format === 'excel') {
        await this.downloadExcel();
      } else {
        await this.downloadPDF();
      }
      this.closeDownloadModal();
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      alert('Error al generar el archivo. Inténtalo de nuevo.');
    }
  }

  private async downloadExcel(): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Agregar datos si está seleccionado
    if (this.downloadConfig.includeData) {
      const selectedColumns = Object.entries(
        this.downloadConfig.selectedVariables
      )
        .filter(([_, selected]) => selected)
        .map(([col]) => col);

      const dataToExport = this.datosOriginales.map((row) => {
        const filteredRow: any = {};
        selectedColumns.forEach((col) => {
          filteredRow[this.getColumnDisplayName(col)] = row[col] || '';
        });
        filteredRow['Riesgo'] = row['riesgo'] || '';
        return filteredRow;
      });

      const dataWorksheet = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(workbook, dataWorksheet, 'Datos');
    }

    // Agregar datos procesados si está seleccionado
    if (
      this.downloadConfig.includeProcessedData &&
      this.datosProcesados.length > 0
    ) {
      const processedWorksheet = XLSX.utils.json_to_sheet(this.datosProcesados);
      XLSX.utils.book_append_sheet(
        workbook,
        processedWorksheet,
        'Datos Procesados'
      );
    }

    // Agregar resumen si está seleccionado
    if (this.downloadConfig.includeSummary) {
      const summaryData = [
        { Métrica: 'Total de estudiantes', Valor: this.resumen?.total || 0 },
        { Métrica: 'En riesgo', Valor: this.resumen?.en_riesgo || 0 },
        { Métrica: 'Sin riesgo', Valor: this.resumen?.sin_riesgo || 0 },
        {
          Métrica: 'Porcentaje en riesgo',
          Valor: `${(
            ((this.resumen?.en_riesgo || 0) / (this.resumen?.total || 1)) *
            100
          ).toFixed(1)}%`,
        },
      ];
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumen');
    }

    // Agregar datos de gráficos si está seleccionado
    if (this.downloadConfig.includeCharts) {
      if (this.downloadConfig.selectedCharts.pie && this.pieData.length > 0) {
        const pieWorksheet = XLSX.utils.json_to_sheet(this.pieData);
        XLSX.utils.book_append_sheet(
          workbook,
          pieWorksheet,
          'Gráfico Circular'
        );
      }

      if (
        this.downloadConfig.selectedCharts.bar &&
        this.barChartData.length > 0
      ) {
        const barWorksheet = XLSX.utils.json_to_sheet(this.barChartData);
        XLSX.utils.book_append_sheet(workbook, barWorksheet, 'Gráfico Barras');
      }

      if (
        this.downloadConfig.selectedCharts.scatter &&
        this.bubbleChartData.length > 0
      ) {
        const scatterData = this.bubbleChartData.flatMap((series) =>
          series.series.map((point: any) => ({
            Grupo: series.name,
            Nombre: point.name,
            [this.getColumnDisplayName(this.selectedXAxis)]: point.x,
            [this.getColumnDisplayName(this.selectedYAxis)]: point.y,
          }))
        );
        const scatterWorksheet = XLSX.utils.json_to_sheet(scatterData);
        XLSX.utils.book_append_sheet(
          workbook,
          scatterWorksheet,
          'Gráfico Dispersión'
        );
      }
    }

    // Descargar archivo
    XLSX.writeFile(
      workbook,
      `reporte_prediccion_abandono_${
        new Date().toISOString().split('T')[0]
      }.xlsx`
    );
  }

  private async downloadPDF(): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let yPosition = 20;

    // Título
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Reporte de Predicción de Abandono Escolar', 20, yPosition);
    yPosition += 10;

    // Fecha
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Resumen si está seleccionado
    if (this.downloadConfig.includeSummary) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumen Ejecutivo', 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Total de estudiantes: ${this.resumen?.total || 0}`,
        20,
        yPosition
      );
      yPosition += 5;
      pdf.text(`En riesgo: ${this.resumen?.en_riesgo || 0}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Sin riesgo: ${this.resumen?.sin_riesgo || 0}`, 20, yPosition);
      yPosition += 5;
      pdf.text(
        `Porcentaje en riesgo: ${(
          ((this.resumen?.en_riesgo || 0) / (this.resumen?.total || 1)) *
          100
        ).toFixed(1)}%`,
        20,
        yPosition
      );
      yPosition += 15;
    }

    // Agregar gráficos si están seleccionados
    if (this.downloadConfig.includeCharts) {
      if (this.downloadConfig.selectedCharts.pie) {
        await this.addChartToPDF(
          pdf,
          'pie-chart',
          'Gráfico Circular',
          yPosition
        );
        yPosition += 80;
      }

      if (this.downloadConfig.selectedCharts.bar) {
        await this.addChartToPDF(
          pdf,
          'bar-chart',
          'Gráfico de Barras',
          yPosition
        );
        yPosition += 80;
      }

      if (this.downloadConfig.selectedCharts.scatter) {
        await this.addChartToPDF(
          pdf,
          'scatter-chart',
          'Gráfico de Dispersión',
          yPosition
        );
        yPosition += 80;
      }
    }

    // Agregar tabla de datos si está seleccionado
    if (this.downloadConfig.includeData) {
      const selectedColumns = Object.entries(
        this.downloadConfig.selectedVariables
      )
        .filter(([_, selected]) => selected)
        .map(([col]) => col);

      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Datos de estudiantes', 20, yPosition);
      yPosition += 10;

      // Agregar tabla (implementación simplificada)
      const tableData = this.datosOriginales.slice(0, 10).map((row) => {
        const filteredRow: string[] = [];
        selectedColumns.slice(0, 3).forEach((col) => {
          // Limitar a 3 columnas por espacio
          filteredRow.push(String(row[col] || ''));
        });
        filteredRow.push(String(row['riesgo'] || ''));
        return filteredRow;
      });

      const headers = selectedColumns
        .slice(0, 3)
        .map((col) => this.getColumnDisplayName(col));
      headers.push('Riesgo');

      // Agregar encabezados
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        pdf.text(header, 20 + index * 40, yPosition);
      });
      yPosition += 5;

      // Agregar datos
      pdf.setFont('helvetica', 'normal');
      tableData.forEach((row) => {
        row.forEach((cell, index) => {
          pdf.text(String(cell).substring(0, 15), 20 + index * 40, yPosition);
        });
        yPosition += 4;
      });

      if (this.datosOriginales.length > 10) {
        pdf.text(
          `... y ${this.datosOriginales.length - 10} registros más`,
          20,
          yPosition + 5
        );
      }
    }

    // Descargar PDF
    pdf.save(
      `reporte_prediccion_abandono_${
        new Date().toISOString().split('T')[0]
      }.pdf`
    );
  }

  private async addChartToPDF(
    pdf: jsPDF,
    chartId: string,
    title: string,
    yPosition: number
  ): Promise<void> {
    try {
      const chartElement = document.getElementById(chartId);
      if (chartElement) {
        const canvas = await html2canvas(chartElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 150;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, 20, yPosition);

        pdf.addImage(
          imgData,
          'PNG',
          20,
          yPosition + 5,
          imgWidth,
          Math.min(imgHeight, 70)
        );
      }
    } catch (error) {
      console.error(`Error al capturar gráfico ${chartId}:`, error);
    }
  }

  // Métodos existentes (mantener los que ya funcionan)
  exportarCSV(): void {
    if (this.resultados.length === 0) return;

    const csvContent = [
      Object.keys(this.resultados[0]).join(','),
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
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim();
  }

  onChartTypeChange(): void {
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
      if (!this.columnasCateg.includes(this.selectedXAxis)) {
        this.selectedXAxis = this.columnasCateg[0] || '';
      }
    }

    this.updateChartData();
  }

  onXAxisChange(): void {
    this.updateChartData();
  }

  /*   private obtenerValorNumerico(fila: any, columna: string): number | null {
    const valor = fila[columna];

    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    const numeroConvertido = Number(valor);
    return isNaN(numeroConvertido) ? null : numeroConvertido;
  } */

  // Métodos de generación de datos (mantener los existentes)
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

    this.pieData.sort((a, b) => b.value - a.value);
  }

  /*   generarBubbleChartData(): void {
    if (
      !this.selectedXAxis ||
      !this.selectedYAxis ||
      this.datosOriginales.length === 0
    ) {
      this.bubbleChartData = [];
      return;
    }

    if (
      !this.columnasNumericas.includes(this.selectedXAxis) ||
      !this.columnasNumericas.includes(this.selectedYAxis)
    ) {
      this.bubbleChartData = [];
      return;
    }

    const puntos = [];

    for (let i = 0; i < this.datosOriginales.length; i++) {
      const fila = this.datosOriginales[i];

      const xVal = this.obtenerValorNumerico(fila, this.selectedXAxis);
      const yVal = this.obtenerValorNumerico(fila, this.selectedYAxis);

      if (xVal !== null && yVal !== null) {
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
          r: 12,
          riesgo: riesgo,
        });
      }
    }

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
  } */
}
