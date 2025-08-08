import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Ruling } from '../models/ruling.model';
import { List } from '../models/list.model';

@Injectable()
export class RulingService {
  constructor(private http: HttpClient) { }

  getAll(): Observable<Ruling[]> {
    return this.http.get<Ruling[]>(`${environment.url}Dictamenes/GetAll`);
  }

  getListByClient(id: number): Observable<List[]> {
    return this.http.get<List[]>(`${environment.url}Lista/GetByClient?id=${id}`);
  }

  getListPendingByClient(id: number): Observable<List[]> {
    return this.http.get<List[]>(`${environment.url}Lista/GetPendingByClient?id=${id}`);
  }

  search(request: any): Observable<Ruling[]> {
    return this.http.post<Ruling[]>(`${environment.url}Dictamenes/Listado`, request);
  }

  getActive(): Observable<Ruling[]> {
    return this.http.get<Ruling[]>(`${environment.url}Dictamenes/GetActive`);
  }

  getById(id: number): Observable<Ruling> {
    return this.http.get<Ruling>(`${environment.url}Dictamenes/Get?id=${id}`);
  }

  save(ruling: Ruling): Observable<any> {
    if (!ruling.idDictamen || ruling.idDictamen === 0)
      return this.http.post<any>(`${environment.url}Dictamenes/Create`, ruling);
    return this.http.put<any>(`${environment.url}Dictamenes/Update`, ruling);
  }

  download(id: number, type: number, typeFormat: number): Observable<HttpResponse<any>> {
    return this.http.get(`${environment.url}Dictamenes/GetDocument?id=${id}&type=${type}&typeFormat=${typeFormat}`, {
      observe: 'response',
      responseType: 'blob' as 'json',
    });
  }
}
