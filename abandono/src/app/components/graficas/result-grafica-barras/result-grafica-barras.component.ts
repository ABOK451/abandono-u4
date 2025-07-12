// result-grafica-barras.component.ts
import { Component, Input } from '@angular/core';
import { Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-result-grafica-barras',
  standalone: false,
  templateUrl: './result-grafica-barras.component.html',
  styleUrl: './result-grafica-barras.component.css',
})
export class ResultGraficaBarrasComponent {
  @Input() barData: any[] = [];
  @Input() xAxisLabel: string = '';
  @Input() yAxisLabel: string = '';
  //@Input() view: [number, number] = [700, 400];
  

  colorScheme: Color = {
    name: 'customBarScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [
      '#2563eb', // blue-600
      '#dc2626', // red-600
      '#16a34a', // green-600
      '#ea580c', // orange-600
      '#7c3aed', // violet-600
      '#0891b2', // cyan-600
      '#be185d', // pink-600
      '#4338ca', // indigo-600
    ],
  };

  get displayXAxisLabel(): string {
    return this.getDisplayName(this.xAxisLabel);
  }

  get displayYAxisLabel(): string {
    return this.getDisplayName(this.yAxisLabel);
  }

  private getDisplayName(column: string): string {
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
      abandono: 'Pensó en Abandonar',
      actividades: 'Actividades Extracurriculares',
      calidad_enseñanza: 'Calidad de Enseñanza',
      transporte: 'Problemas de Transporte',
      riesgo: 'Nivel de Riesgo',
      abandona: 'Abandona',
    };

    return displayNames[column] || column;
  }
  
}
