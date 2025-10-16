import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class ServiceService {
  constructor(private http: HttpClient) { }

  getAll(): Observable<Service[]> {
    return this.http.get<Service[]>(`${environment.url}Service/GetAll`);
  }

  getAllActive(): Observable<Service[]> {
    return this.http.get<Service[]>(`${environment.url}Service/GetAllActive`);
  }

  getById(id: number): Observable<Service> {
    return this.http.get<Service>(`${environment.url}Service/Get?id=${id}`);
  }

  save(service: Service): Observable<any> {
    if (!service.idServicio || service.idServicio === 0)
      return this.http.post<any>(`${environment.url}Service/Create`, service);
    return this.http.put<any>(`${environment.url}Service/Update`, service);
  }
}

export interface Service {
  idServicio: number;
  nombre?: string;
  idEstatus?: number;
  idUsuario?: number;
  fCaptura?: string;
  fModifica?: string;
}

