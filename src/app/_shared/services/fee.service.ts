import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class FeeService {
  constructor(private http: HttpClient) { }

  search(request: SearchFee): Observable<Fee[]> {
    return this.http.post<Fee[]>(`${environment.url}Fee/Search`, request);
  }

  getById(id: number): Observable<Fee> {
    return this.http.get<Fee>(`${environment.url}Fee/Get?id=${id}`);
  }

  getCurrent(idServicio: number, idCliente: number, idBodega: number): Observable<Fee[]> {
    return this.http.get<Fee[]>(`${environment.url}Fee/GetByServicio?idServicio=${idServicio}&idCliente=${idCliente}&idBodega=${idBodega}`);
  }

  updateStatus(fee: Fee): Observable<any> {
    return this.http.put<any>(`${environment.url}Fee/UpdateStatus`, fee);
  }

  save(fee: Fee): Observable<any> {
    if (!fee.idCuota || fee.idCuota === 0)
      return this.http.post<any>(`${environment.url}Fee/Create`, fee);
    return this.http.put<any>(`${environment.url}Fee/Update`, fee);
  }
}

export interface SearchFee {
  idBodega: number;
  idCliente?: number;
  fechaDel?: string;
  fechaAl?: string;
  cancelados?: boolean;
}

export interface Fee {
  idCuota: number;
  idBodega?: number;
  idCliente?: number;
  idEstatus?: number;
  bodega?: string;
  cliente?: string;
  idServicio?: number;
  cuota?: number;
  iva?: number;
  cuotaPorPorcentaje?: boolean;
  aplicaIva?: boolean;
  fVigenciaIni?: string;
  fVigenciaFin?: string;
  observaciones?: string;
}
