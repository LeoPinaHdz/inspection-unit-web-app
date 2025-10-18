import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ReplaySubject, Subject, lastValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { ClientService } from 'src/app/_shared/services/client.service';
import { Client } from 'src/app/_shared/models/client.model';
import { List, ListDetail } from 'src/app/_shared/models/list.model';
import { ListService } from 'src/app/_shared/services/list.service';
import { ExecutiveService } from 'src/app/_shared/services/executive.service';
import { SelectionModel } from '@angular/cdk/collections';
import { Request } from 'src/app/_shared/models/request.model';
import { StandardService } from 'src/app/_shared/services/standard.service';
import { MatPaginator } from '@angular/material/paginator';
import { saveFile } from 'src/app/_shared/utils/file.utils';
import { MatSort } from '@angular/material/sort';
import { DocumentService } from 'src/app/_shared/services/documents.service';

@Component({
  selector: 'list-detail',
  templateUrl: './list-detail.component.html',
})
export class ListDetailComponent implements OnInit, OnDestroy {
  listForm!: FormGroup;
  listFormComments!: FormGroup;
  isEdit = false;
  id: any;
  list: List = { idLista: 0, idEstatus: 1 };
  selectedDetail?: ListDetail;
  listDetails: any[] = [];
  clients: Client[] = [];
  requests: Request[] = [];
  filteredClients: ReplaySubject<Client[]> = new ReplaySubject<Client[]>(1);
  displays: any[] = [];
  executives: any[] = [];
  allExecutives: any[] = [];
  referenceDetails: any[] = [];
  standardPoints: any[] = [];
  displayedColumns: string[] = ['select', 'Marca', 'Producto', 'Modelo', 'UMC', 'Cantidad', 'Etiquetas', 'Pais', 'Saldo'];
  displayedColumnsType0: string[] = ['select', 'Marca', 'Producto', 'Modelo', 'UMC', 'Cantidad', 'Etiquetas', 'Pais', 'Saldo'];
  displayedColumnsType1: string[] = ['select', 'SubFolio', 'Marca', 'Producto', 'Modelo', 'UMC', 'Cantidad', 'Etiquetas', 'Pais', 'Fraccion', 'Saldo'];
  displayedColumnsStandard: string[] = ['contenido', 'dictaminacion', 'observaciones'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  standardDetails: MatTableDataSource<any> = new MatTableDataSource();
  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  _onDestroy = new Subject<void>();
  selection = new SelectionModel<any>(true, []);
  result: string = 'C';
  resultText: string = 'Cumple';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private listService: ListService,
    private clientService: ClientService,
    private executiveService: ExecutiveService,
    private dialog: MatDialog,
    private documentService: DocumentService,
    private standardService: StandardService
  ) { }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');

    this.listForm = new FormGroup({
      idLista: new FormControl({ value: '', disabled: true }, []),
      idCliente: new FormControl({ value: '', disabled: this.id }, [Validators.required]),
      idSolicitud: new FormControl({ value: '', disabled: this.id }, [Validators.required]),
      clientFilter: new FormControl('', []),
      fEntrada: new FormControl(new Date()),
      fInspeccion: new FormControl({ value: new Date(), disabled: false }, [Validators.required]),
      fPresentacion: new FormControl({ value: new Date(), disabled: false }, [Validators.required]),
      idEjecutivo: new FormControl('', [Validators.required]),
      idEjecutivo2: new FormControl('', [Validators.required]),
      idServicio: new FormControl({ value: '0', disabled: this.id }, [Validators.required]),
      tecnica: new FormControl(''),
      lote: new FormControl('', [Validators.required]),
      muestra: new FormControl('', []),
      presentacion: new FormControl('', [Validators.maxLength(250)]),
      instrumento: new FormControl(''),
      observaciones: new FormControl(''),
      puntos: new FormControl(''),
      resumen: new FormControl(''),
      contenido: new FormControl(''),
      medidas: new FormControl('', [Validators.maxLength(500)]),
      producto: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      marca: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      modelo: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      etiquetas: new FormControl('', [Validators.required]),
      pais: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      base: new FormControl('', [Validators.maxLength(200)]),
      altura: new FormControl('', [Validators.maxLength(200)]),
      diametro: new FormControl('', [Validators.maxLength(200)]),
      spe: new FormControl('', [Validators.maxLength(200)]),
      agrupacion: new FormControl('', [Validators.maxLength(250)])
    });

    if (!this.id) {
      this.listForm.get('idSolicitud')!.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.loadExecutive();
          this.loadStandardPoints();
          this.loadRequestDetail();
        });

      this.listForm.get('idServicio')!.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.displayedColumns = this.listForm.get('idServicio')!.value == 0 ? this.displayedColumnsType0 : this.displayedColumnsType1;
          this.loadRequests();
        });
    }

    this.executiveService.getActive()
      .pipe()
      .subscribe({
        next: (response) => {
          this.allExecutives = response;
          if (this.allExecutives.length > 0) this.listForm.get('idEjecutivo2')!.setValue(this.allExecutives[0].idEjecutivo);
        },
        error: () => {
          console.error('Error trying to get all executives');
        }
      });

    try {
      this.clients = await lastValueFrom(this.clientService.getAllActive());
      if (this.clients.length > 0) this.listForm.get('idCliente')!.setValue(this.clients[0].idCliente);
      this.filteredClients.next(this.clients.slice());

      if (!this.id) {
        this.listForm.get('idCliente')!.valueChanges
          .pipe(takeUntil(this._onDestroy))
          .subscribe(() => {
            this.loadRequests();
          });
        this.loadRequests();

        this.listForm.get('clientFilter')!.valueChanges
          .pipe(takeUntil(this._onDestroy))
          .subscribe(() => {
            this.filterClients();
          });
      }
    } catch (error) {
      console.error('Error trying to get clients', error);
    }

    if (this.id) {
      this.isEdit = true;

      this.listService.getById(this.id)
        .pipe()
        .subscribe({
          next: (response) => {
            this.updateForm(response);
          },
          error: () => {
            this.dialog.open(SimpleDialogComponent, {
              data: { type: 'error', message: `Error al obtener los datos del lista ${this.id}` },
            })
              .afterClosed()
              .subscribe(() => {
                this.router.navigate([`/secure/lists`]);
              });
            console.error('Error trying to get list detail');
          }
        });
    }
  }

  loadRequests() {
    this.requests = [];
    this.listForm.get('idSolicitud')!.setValue('');
    if (this.listForm.get('idServicio')!.invalid || this.listForm.get('idCliente')!.invalid) return;
    this.listService.getPendingRequests(this.listForm.get('idCliente')!.value, this.listForm.get('idServicio')!.value == 1)
      .pipe()
      .subscribe({
        next: (response) => {
          this.requests = response;
        },
        error: () => {
          console.error('Error trying to get pending requests');
        }
      });
  }

  loadRequestDetail() {
    this.referenceDetails = [];
    this.dataSource = new MatTableDataSource(this.referenceDetails);
    if (this.listForm.get('idServicio')!.invalid || this.listForm.get('idSolicitud')!.invalid) return;
    this.listService.getRequestDetail(this.listForm.get('idSolicitud')!.value, this.listForm.get('idServicio')!.value == 1)
      .pipe()
      .subscribe({
        next: (response) => {
          this.referenceDetails = response;
          this.dataSource = new MatTableDataSource(this.referenceDetails);
          this.dataSource.sort = this.sort;
          this.selection.clear();
        },
        error: () => {
          console.error('Error trying to get request details');
        }
      });
  }

  getStandard(): number {
    if (!this.requests) return 0;

    const requestId = this.listForm.get('idSolicitud')!.value;
    const selectedRequest = this.requests.filter(r => r.idSolicitud == requestId);

    return selectedRequest && selectedRequest.length > 0 ? (selectedRequest[0].idNorma || 0) : 0;
  }

  loadExecutive() {
    this.executives = [];
    if (this.listForm.get('idSolicitud')!.invalid) return;
    this.executiveService.getByStandard(this.getStandard())
      .pipe()
      .subscribe({
        next: (response) => {
          this.executives = response;
          if (this.executives.length > 0) this.listForm.get('idEjecutivo')!.setValue(this.executives[0].idEjecutivo);
        },
        error: () => {
          console.error('Error trying to get executives');
        }
      });
  }

  loadStandardPoints() {
    this.standardPoints = [];
    this.standardDetails = new MatTableDataSource(this.standardPoints);
    if (this.listForm.get('idSolicitud')!.invalid) return;
    this.standardService.getById(this.getStandard())
      .pipe()
      .subscribe({
        next: (response) => {
          const idServicio = this.listForm.get('idServicio')!.value;
          const standarPoints = response.normaPuntos || [];

          this.standardPoints = standarPoints.filter(p => p.idServicio == idServicio);
          this.standardDetails = new MatTableDataSource(this.standardPoints);
          this.standardDetails.paginator = this.paginator;
          this.updateResult('C');
        },
        error: () => {
          console.error('Error trying to get executives');
        }
      });
  }

  updateResult(result: string) {
    this.standardDetails.data.forEach(sd => sd.dictaminacion = result);
    this.result = result;
  }

  updateSingleResult() {
    const nc = this.standardDetails.data.filter(d => d.dictaminacion === 'NC');
    const c = this.standardDetails.data.filter(d => d.dictaminacion === 'C');

    if (nc && nc.length > 0) {
      this.result = 'NC';
      this.resultText = 'No Cumple';
    } else if (c && c.length > 0) {
      this.result = 'C';
      this.resultText = 'Cumple';
    } else {
      this.result = 'NA';
      this.resultText = 'NO esta SUJETA';
    }
  }

  onSubmit(): void {
    this.listForm.markAllAsTouched();
    if (!this.listForm.valid || this.selection.isEmpty()) return;

    let request = { ...this.list, ...this.listForm.getRawValue() };

    request.muestra = `${request.muestra}`;
    request.lote = `${request.lote}`;
    request.dictaminacion = this.result;
    request.listasDetalle = this.selection.selected.map(r => {
      return {
        idFolioDetalle: request.idServicio == 0 ? 0 : r.IdFolioDetalle,
        idSolicitudDetalle: request.idServicio == 1 ? 0 : r.IdSolicitudDetalle,
        cantidad: r.Cantidad,
        idEstatus: request.idEstatus
      };
    });

    request.listasPunto = this.standardDetails.data.map(s => {
      return {
        idPunto: s.idNormaPunto,
        dictaminacion: s.dictaminacion,
        observaciones: s.observaciones ? s.observaciones : ''
      };
    });

    this.dialog.open(SimpleDialogComponent, {
      data: { type: 'alert', message: `Esta Lista de Verificación : ${this.resultText}` },
    })
      .afterClosed()
      .subscribe((confirmado: Boolean) => {
        this.listService.save(request)
          .pipe()
          .subscribe({
            next: (response) => {
              this.dialog.open(SimpleDialogComponent, {
                data: { type: 'success', message: `La lista ${request.idLista} fue guardada con éxito` },
              })
                .afterClosed()
                .subscribe((confirmado: Boolean) => {
                  this.router.navigate([`/secure/lists`]);
                });
            },
            error: () => {
              this.dialog.open(SimpleDialogComponent, {
                data: { type: 'error', message: `Error al guardar la lista ${request.idLista}` },
              });
              console.error('Error trying to save lists');
            }
          });
      });
  }

  updateForm(list: List): void {
    this.list = list;
    this.listForm.patchValue(list);
    this.listForm.patchValue({
      idServicio: list.idServicio ? '1' : '0'
    });

    this.requests = [{ idSolicitud: list.idSolicitud || 0, clave: list.claveSolicitud, idNorma: list.idNorma }];
    this.result = list.dictaminacion || 'C';
    this.displayedColumns = list.idServicio ? this.displayedColumnsType1 : this.displayedColumnsType0;

    if (this.result === 'NC') {
      this.resultText = 'No Cumple';
    } else if (this.result === 'C') {
      this.resultText = 'Cumple';
    } else {
      this.resultText = 'NO esta SUJETA';
    }

    this.loadExecutive();

    this.referenceDetails = list.listasDetalle || [];
    this.dataSource = new MatTableDataSource(this.referenceDetails);
    this.toggleAllRows();

    this.standardPoints = list.listasPunto || [];
    this.standardDetails = new MatTableDataSource(this.standardPoints);
    this.standardDetails.paginator = this.paginator;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.updateLoteNew();

      return;
    }

    this.selection.select(...this.dataSource.data);
    this.updateLoteNew();
  }

  toggleRow(row: any) {
    this.selection.toggle(row);

    this.updateLoteNew();
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'Deselecciona' : 'Selecciona'} todos`;
    }
    return `${this.selection.isSelected(row) ? 'Deselecciona' : 'Selecciona'} row ${row.folio}`;
  }

  updateLoteNew() {
    const sum = this.selection.selected.map(s => Number(s.Cantidad || 0)).reduce((acc, value) => acc + value, 0);

    this.listForm.get('etiquetas')!.setValue(sum);
  }

  updateLote() {
    const sum = this.selection.selected.map(s => Number(s.Etiquetas || 0)).reduce((acc, value) => acc + value, 0);

    this.listForm.get('lote')!.setValue(sum);

    if (sum != 0) {
      this.listService.getMuestreo(sum)
        .pipe()
        .subscribe({
          next: (response) => {
            this.listForm.get('muestra')!.setValue(response && response.length ? response[0].Muestra : 0);
          },
          error: () => {
            console.error('Error trying to get range');
          }
        });
    } else {
      this.listForm.get('muestra')!.setValue(0);
    }
  }

  downloadFile(type: number): void {
    this.documentService.downloadList(this.id, type).subscribe(response => {
      saveFile(response.body, this.documentService.getAttachmentFilename(`Lista-${this.list.idLista}.pdf`, response.headers.get('Content-Disposition')),
        response.headers.get('Content-Type') || 'application/octet-stream');
    });
  }

  private filterClients() {
    if (!this.clients) {
      return;
    }
    let search = this.listForm.get('clientFilter')!.value;
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

  get form() {
    return this.listForm.controls;
  }
}
