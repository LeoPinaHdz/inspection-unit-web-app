import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Letter } from 'src/app/_shared/models/letter.model';
import { FormControl, FormGroup } from '@angular/forms';
import { ClientService } from 'src/app/_shared/services/client.service';
import { formatDateString } from 'src/app/_shared/utils/date.utils';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { Client } from 'src/app/_shared/models/client.model';
import { Standard } from 'src/app/_shared/models/standard.model';
import { StandardService } from 'src/app/_shared/services/standard.service';
import { ListService } from 'src/app/_shared/services/list.service';

@Component({
  selector: 'list',
  templateUrl: './list.component.html'
})

export class ListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'lista',
    'cliente',
    'norma',
    'pedimento',
    'servicio',
    'conclusion',
    'estatus',
    'solicitud',
    'action'
  ];
  _onDestroy = new Subject<void>();
  searchForm!: FormGroup;
  clients: Client[] = [];
  standards: Standard[] = [];
  filteredClients: ReplaySubject<Client[]> = new ReplaySubject<Client[]>(1);
  dataSource: MatTableDataSource<Letter> = new MatTableDataSource();

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  constructor(
    private listService: ListService,
    private clientService: ClientService,
    private standardService: StandardService
  ) { }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  ngOnInit() {
    this.searchForm = new FormGroup({
      cliente: new FormControl('', []),
      clientFilter: new FormControl('', []),
      norma: new FormControl('', []),
      fechaDel: new FormControl('', []),
      fechaAl: new FormControl('', []),
      pedimento: new FormControl('', []),
      idSolicitud: new FormControl('', []),
    });

    this.standardService.getAllActive()
      .pipe()
      .subscribe({
        next: (response) => {
          this.standards = response;
        },
        error: () => {
          console.error('Error trying to get standards');
        }
      });

    this.clientService.getAllActive()
      .pipe()
      .subscribe({
        next: (response) => {
          this.clients = response;
          this.filteredClients.next(this.clients.slice());
          this.searchForm.get('clientFilter')!.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
              this.filterClients();
            });
        },
        error: () => {
          console.error('Error trying to get clients');
        }
      });
  }

  onSearch() {
    const request = this.searchForm.getRawValue();

    request.fechaDel = request.fechaDel ? formatDateString(request.fechaDel) : '';
    request.fechaAl = request.fechaAl ? formatDateString(request.fechaAl) : '';
    request.idCliente = request.cliente || 0;
    request.norma = request.norma || 0;

    if (!request.idSolicitud) {
      delete request['idSolicitud'];
    }

    this.listService.search(request).
      pipe()
      .subscribe({
        next: (response) => {
          this.dataSource = new MatTableDataSource(response);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        },
        error: () => {
          console.error('Error trying to get lists');
        }
      });
  }

  private filterClients() {
    if (!this.clients) {
      return;
    }
    let search = this.searchForm.get('clientFilter')!.value;
    if (!search) {
      this.filteredClients.next(this.clients.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    this.filteredClients.next(
      this.clients.filter(client => client.nombre!.toLowerCase().indexOf(search) > -1)
    );
  }
}