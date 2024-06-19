import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Contract } from 'src/app/_shared/models/contract.model';
import { Client } from 'src/app/_shared/models/client.model';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { ConfirmationDialogComponent } from 'src/app/_shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { ReferenceService } from 'src/app/_shared/services/reference.service';
import { Reference } from 'src/app/_shared/models/reference.model';
import { CountrySE } from 'src/app/_shared/models/country.model';
import { Standard } from 'src/app/_shared/models/standard.model';
import { formatDateString } from 'src/app/_shared/utils/date.utils';

@Component({
  selector: 'reference-search',
  templateUrl: './reference-search.component.html'
})

export class ReferenceSearchComponent implements OnInit, OnDestroy, OnChanges {
  @Input() clients: Client[] = [];
  @Input() countries: CountrySE[] = [];
  @Input() standards: Standard[] = [];
  searchForm!: FormGroup;
  isListMode = true;
  selectedReference: any = 0;
  filteredClients: ReplaySubject<Client[]> = new ReplaySubject<Client[]>(1);
  _onDestroy = new Subject<void>();
  displayedColumns: string[] = [
    'FolioFormato',
    'NomCliente',
    'Estatus',
    'NombreArchivo',
    'action'
  ];
  dataSource: MatTableDataSource<Contract> = new MatTableDataSource();

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  constructor(
    private referenceService: ReferenceService,
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
      folioIni: new FormControl('', []),
      folioFin: new FormControl('', []),
      idEstatus: new FormControl('', [])
    });

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.clients && this.clients.length > 0) {
      this.filteredClients.next(this.clients.slice());
      this.searchForm.get('clientFilter')!.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.filterClients();
        });
    }
  }

  onSearch() {
    const request = this.searchForm.getRawValue();

    request.fechaDel = request.fechaDel ? formatDateString(request.fechaDel) : '';
    request.fechaAl = request.fechaAl ? formatDateString(request.fechaAl) : '';
    request.folioIni = request.folioIni || 0;
    request.folioFin = request.folioFin || 0;
    request.cliente = request.cliente || 0;
    request.norma = request.norma || 0;
    request.idEstatus = request.idEstatus || 0;

    this.referenceService.search(request).
      pipe()
      .subscribe({
        next: (response) => {
          this.dataSource = new MatTableDataSource(response);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        },
        error: () => {
          console.error('Error trying to get references');
        }
      });
  }

  onReferenceSelect(reference: any) {
    this.selectedReference = reference;
    this.isListMode = false;
  }

  onRefresh() {
    this.isListMode = true;
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