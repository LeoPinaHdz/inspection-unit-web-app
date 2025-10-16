import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class PendingSalesService {
  constructor(private http: HttpClient) { }

  search(request: SearchPendingSales): Observable<PendingSales[]> {
    return this.http.post<PendingSales[]>(`${environment.url}PendingSalesOrder/Search`, request);
  }
  
  generate(request: GeneratePendingSales): Observable<PendingSales[]> {
    return this.http.post<PendingSales[]>(`${environment.url}PendingSalesOrder/Generate`, request);
  }

  getReport(pendingSales: PendingSales[]): Observable<any> {
    return this.http.post<any>(`${environment.url}PendingSalesOrder/Assign`, pendingSales);
  }
}

export interface SearchPendingSales {
  idBodega: Number;
  idCliente?: string;
  fechaDel?: string;
  fechaAl?: string;
  idServicio?: string;
  procesados?: boolean;
}

export interface GeneratePendingSales {
  tipoFactura: string;
  detalle: PendingSales[];
}

export interface PendingSales {
  almacen?: string;
  cliente?: string;
  servicio?: string;
  fechaEmision?: string;
  cantidad?: number;
  unidad?: string;
  cuota?: string;
  referencia?: string;
  idOrdenServicio?: number;
  idCliente?: number;
  idBodega?: number;
  idServicio?: number;
  idUnidad?: number;
  retorno?: number;
}
