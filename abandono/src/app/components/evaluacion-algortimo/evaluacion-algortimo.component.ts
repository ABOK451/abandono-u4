import { Component } from '@angular/core';

@Component({
  selector: 'app-evaluacion-algortimo',
  standalone: false,
  templateUrl: './evaluacion-algortimo.component.html',
  styleUrl: './evaluacion-algortimo.component.css',
})
export class EvaluacionAlgortimoComponent {
  metricas = JSON.parse(localStorage.getItem('resultados')!)
    ?.metricas_evaluacion;
}
