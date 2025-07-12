// result-grafia-pastel.component.ts
import {
  Component,
  Input,
  HostListener,
} from '@angular/core';
import { Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-result-grafia-pastel',
  standalone: false,
  templateUrl: './result-grafia-pastel.component.html',
  styleUrl: './result-grafia-pastel.component.css',
})
export class ResultGrafiaPastelComponent {
  @Input() pieData: any[] = [];
  @Input() view: [number, number] = [700, 400];
  @Input() colorScheme: Color = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#2563eb', '#dc2626', '#16a34a', '#ea580c', '#7c3aed', '#0891b2'],
  };

  // Variables para tooltip personalizado
  showTooltip = false;
  tooltipData: any = null;
  tooltipPosition = { x: 0, y: 0 };

  // Función para calcular el porcentaje
  getPercentage(value: number): number {
    const total = this.pieData.reduce((sum, item) => sum + item.value, 0);
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  // Función para formatear números con separadores de miles
  formatNumber(value: number): string {
    return value.toLocaleString('es-MX');
  }

  // Función para obtener el total de estudiantes
  getTotalStudents(): number {
    return this.pieData.reduce((sum, item) => sum + item.value, 0);
  }

  // Función para obtener color de un item específico
  getColorForItem(name: string): string {
    const index = this.pieData.findIndex((item) => item.name === name);
    return this.colorScheme.domain[index % this.colorScheme.domain.length];
  }



  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.showTooltip) {
      this.tooltipPosition = {
        x: event.clientX + 10,
        y: event.clientY - 10,
      };
    }
  }
}
