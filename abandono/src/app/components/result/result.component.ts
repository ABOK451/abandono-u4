import { Component, OnInit } from '@angular/core';
import { Color, ScaleType } from '@swimlane/ngx-charts';


@Component({
  selector: 'app-result',
  standalone: false,
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent implements OnInit {
  resultados: any[] = [];
  resumen: any;
  dataList: any[] = [];
  colorScheme: Color = {
  name: 'customScheme',
  selectable: true,
  group: ScaleType.Ordinal,
  domain: ['#e53935', '#43a047']
};


  // Datos para ngx-charts (pastel)
  view: [number, number] = [700, 400];

  pieData = [
    { name: 'En riesgo', value: 0 },
    { name: 'Sin riesgo', value: 0 }
  ];



  ngOnInit(): void {
    const data = JSON.parse(localStorage.getItem('resultados') || '{}');
    this.resultados = data.resultados || [];
    this.resumen = data.resumen || {};
    this.dataList = data.descargable || [];

    const enRiesgo = this.resumen?.en_riesgo || 0;
    const sinRiesgo = this.resumen?.sin_riesgo || 0;

    this.pieData = [
      { name: 'En riesgo', value: enRiesgo },
      { name: 'Sin riesgo', value: sinRiesgo }
    ];
  }

  exportarCSV(): void {
    if (this.resultados.length === 0) return;

    const csvContent = [
      Object.keys(this.resultados[0]).join(','), // encabezado
      ...this.resultados.map(r => Object.values(r).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'resultados.csv';
    link.click();
  }
}
