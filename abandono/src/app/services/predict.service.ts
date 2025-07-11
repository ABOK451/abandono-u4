import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PredictService {

  private baseUrl = 'http://127.0.0.1:8000'; // Cambia si tu backend está desplegado

  constructor(private http: HttpClient) { }

  subirCSV(file: File): Observable<any[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any[]>(`${this.baseUrl}/predecir/`, formData);
  }
}
