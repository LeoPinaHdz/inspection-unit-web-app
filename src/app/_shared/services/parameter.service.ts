import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class ParameterService {
  constructor(private http: HttpClient) { }

  searchByTipo(request: SearchParameter): Observable<Parameter[]> {
    return of([{idParametro: 1, valor: 'POR CLIENTE'}]);
  }
}

export interface SearchParameter {
  tipo: string;
}

export interface Parameter {
  idParametro: number;
  idEstatus?: number;
  fVigenciaIni?: string;
  fVigenciaFin?: string;
  descripcion?: string;
  valor?: string;
  tipo?: string;
}
