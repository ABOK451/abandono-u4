import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
//import { UploadComponent } from './components/upload/upload.component';
import { HomeComponent } from './components/home/home.component';
import { ResultComponent } from './components/result/result.component';

const routes: Routes = [
  { path: '', component: HomeComponent },           // Ruta inicial
  { path: 'home', component: HomeComponent },       // Ruta opcional /home
  //{ path: 'upload', component: UploadComponent },
  { path: 'result', component: ResultComponent },   // Ruta para subir el dataset
   // Ruta para subir el dataset
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
