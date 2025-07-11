import { Component } from '@angular/core';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upload',
  standalone: false,
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  cantidadSeleccionada: number = 5;

get datosFiltrados(): any[] {
  return this.datos.slice(0, this.cantidadSeleccionada);
}

  archivo!: File;
  columnas: string[] = [];
  datos: any[] = [];

validarCantidad() {
  if (this.cantidadSeleccionada < 5) {
    this.cantidadSeleccionada = 5;
  } else if (this.cantidadSeleccionada > this.datos.length) {
    this.cantidadSeleccionada = this.datos.length;
  }
}

  constructor(private http: HttpClient, private router: Router) {}

  seleccionarArchivo(event: any) {
    this.archivo = event.target.files[0];
    this.leerArchivo(this.archivo);
  }

  get columnasConIndice(): string[] {
  return ['indice', ...this.columnas];
}


  leerArchivo(file: File) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') {
      this.leerCSV(file);
    } else if (extension === 'xls' || extension === 'xlsx') {
      this.leerExcel(file);
    } else if (extension === 'txt') {
      this.leerTXT(file);
    } else {
      alert('Formato no soportado. Por favor sube un archivo CSV, Excel o TXT.');
      this.columnas = [];
      this.datos = [];
    }
  }

  leerCSV(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const csv = reader.result as string;
      const resultados = Papa.parse(csv, { header: true });
      this.datos = resultados.data.filter(row => Object.keys(row as object).length > 0);
      this.columnas = resultados.meta.fields || [];
    };
    reader.readAsText(file);
  }


  leerExcel(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      this.datos = jsonData;
      this.columnas = Object.keys(jsonData[0] as object);
    };
    reader.readAsArrayBuffer(file);
  }

  leerTXT(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const txt = reader.result as string;
      const resultados = Papa.parse(txt, { header: true });
      this.datos = resultados.data.filter(row => Object.keys(row as object).length > 0);
      this.columnas = resultados.meta.fields || [];
    };
    reader.readAsText(file);
  }

  enviarArchivo() {
    if (!this.archivo || this.datos.length === 0) {
      alert('Por favor, selecciona un archivo con datos');
      return;
    }

    const subset = this.datos.slice(0, this.cantidadSeleccionada);
    const formData = new FormData();
    formData.append('filas', JSON.stringify(subset));
    formData.append('variables', JSON.stringify(this.columnas));

    this.http.post('http://127.0.0.1:8000/predecir', formData).subscribe(
      (res) => {
        localStorage.setItem('resultados', JSON.stringify(res));
        this.router.navigate(['/result']);
      },
      (err) => {
        alert('Error al enviar los datos');
        console.error(err);
      }
    );
  }
}
