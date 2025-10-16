import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class OrderServiceService {
  constructor(private http: HttpClient) { }

  search(request: SearchOrderService): Observable<OrderService[]> {
    return this.http.post<OrderService[]>(`${environment.url}OrderService/Search`, request);
  }

  getById(id: number): Observable<OrderService> {
    return this.http.get<OrderService>(`${environment.url}OrderService/Get?id=${id}`);
  }

  updateStatus(orderService: OrderService): Observable<any> {
    return this.http.put<any>(`${environment.url}OrderService/UpdateStatus`, orderService);
  }

  save(orderService: OrderService): Observable<any> {
    if (!orderService.idOrdenServicio || orderService.idOrdenServicio === 0)
      return this.http.post<any>(`${environment.url}OrderService/Create`, orderService);
    return this.http.put<any>(`${environment.url}OrderService/Update`, orderService);
  }
}

export interface SearchOrderService {
  idBodega: number;
  idCliente?: number;
  fechaDel?: string;
  fechaAl?: string;
  cancelados?: boolean;
}

export interface OrderServiceDetail {
  idOrdenServicioDetalle: Number;
  idOrdenServicio?: Number;
  idServicio?: Number;
  partida: Number;
  idUnidad?: Number;
  cantidad?: number;
  referencia?: string;
  fCaptura?: string;
  fModificacion?: string;
  idUsuario?: Number;
  idEstatus?: Number;
  nombreUnidad?: string;
  nombreServicio?: string;
}

export interface OrderService {
  idOrdenServicio: number;
  idBodega?: number;
  idCliente?: number;
  idEstatus?: number;
  bodega?: string;
  cliente?: string;
  idServicio?: number;
  fServicio?: string;
  observaciones?: string;
  detalle?: OrderServiceDetail[];
}
