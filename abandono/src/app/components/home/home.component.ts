import { Component } from '@angular/core';
import { PredictService } from '../../services/predict.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
constructor(private router: Router) {}

  irASubir() {
    this.router.navigate(['/upload']);
  }



}
