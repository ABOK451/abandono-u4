import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ResultComponent } from './components/result/result.component';
import { UploadComponent } from './components/upload/upload.component';
import { HomeComponent } from './components/home/home.component';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { ResultGrafiaPastelComponent } from './components/graficas/result-grafia-pastel/result-grafia-pastel.component';
import { ResultGraficaBarrasComponent } from './components/graficas/result-grafica-barras/result-grafica-barras.component';
import { ResultGraficaDispersionComponent } from './components/graficas/result-grafica-dispersion/result-grafica-dispersion.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { EvaluacionAlgortimoComponent } from './components/evaluacion-algortimo/evaluacion-algortimo.component';
@NgModule({
  declarations: [
    AppComponent,
    ResultComponent,
    UploadComponent,
    HomeComponent,
    ResultGrafiaPastelComponent,
    ResultGraficaBarrasComponent,
    ResultGraficaDispersionComponent,
    NavbarComponent,
    EvaluacionAlgortimoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    FormsModule,
    MatTableModule,
    MatSelectModule,
    MatOptionModule,
    NgxChartsModule,
    HttpClientModule,
],
  providers: [
    provideClientHydration(withEventReplay())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
