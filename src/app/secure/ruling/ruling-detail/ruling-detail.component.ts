import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReplaySubject, Subject, lastValueFrom, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { RulingService } from 'src/app/_shared/services/ruling.service';
import { Ruling } from 'src/app/_shared/models/ruling.model';
import { Client } from 'src/app/_shared/models/client.model';
import { Request } from 'src/app/_shared/models/request.model';
import { ClientService } from 'src/app/_shared/services/client.service';
import { Official } from 'src/app/_shared/models/official.model';
import { Executive } from 'src/app/_shared/models/executive.model';
import { ExecutiveService } from 'src/app/_shared/services/executive.service';
import { OfficialService } from 'src/app/_shared/services/official.service';
import { RequestService } from 'src/app/_shared/services/request.service';
import { List } from 'src/app/_shared/models/list.model';
import { saveFile } from 'src/app/_shared/utils/file.utils';
import { DocumentService } from 'src/app/_shared/services/documents.service';

@Component({
  selector: 'rulings',
  templateUrl: './ruling-detail.component.html',
})
export class RulingDetailComponent implements OnInit, OnDestroy {
  id: any;
  isEdit = false;
  ruling: Ruling = { idDictamen: 0, idEstatus: 1 };
  clients: Client[] = [];
  officials: Official[] = [];
  executives: Executive[] = [];
  requests: List[] = [];
  rulingForm!: FormGroup;
  filteredClients: ReplaySubject<Client[]> = new ReplaySubject<Client[]>(1);
  protected _onDestroy = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private rulingService: RulingService,
    private clientService: ClientService,
    private executiveService: ExecutiveService,
    private officialService: OfficialService,
    private documentService: DocumentService,
    private dialog: MatDialog
  ) { }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');

    this.rulingForm = new FormGroup({
      idDictamen: new FormControl({ value: '', disabled: true }, []),
      idCliente: new FormControl({ value: '', disabled: this.id }, [Validators.required]),
      clientFilter: new FormControl('', []),
      idLista: new FormControl({ value: '', disabled: this.id }, [Validators.required]),
      tipoServicio: new FormControl({ value: '', disabled: true }),
      clave: new FormControl({ value: '', disabled: true }, []),
      dictaminacion: new FormControl({ value: '', disabled: true }, []),
      fDictamen: new FormControl(new Date(), [Validators.required, Validators.maxLength(100)]),
      idFuncionario: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      idEjecutivo: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      observaciones: new FormControl('', [Validators.maxLength(255)])
    });

    if (this.id) {
      this.isEdit = true;

      this.rulingService.getById(this.id)
        .pipe()
        .subscribe({
          next: (response) => {
            this.updateForm(response);
          },
          error: () => {
            this.dialog.open(SimpleDialogComponent, {
              data: { type: 'error', message: `Error al obtener los datos del dictamen ${this.id}` },
            })
              .afterClosed()
              .subscribe(() => {
                this.router.navigate([`/secure/rulings`]);
              });
            console.error('Error trying to get ruling detail');
          }
        });
    }
    
    if (!this.id) {
      this.rulingForm.get('idLista')!.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.updateSelectedList();
      });
    }

    try {
      this.clients = await lastValueFrom(this.clientService.getAllActive());
      this.filteredClients.next(this.clients.slice());
      this.rulingForm.get('clientFilter')!.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.filterClients();
        });

      if (this.clients.length > 0) this.rulingForm.get('idCliente')!.setValue(this.clients[0].idCliente);

      this.rulingForm.get('idCliente')!.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.loadRequests();
        });
      if (!this.id) this.loadRequests();
    } catch (error) {
      console.error('Error trying to get clients');
    }

    try {
      this.executives = await lastValueFrom(this.executiveService.getActive());
      if (this.executives.length > 0) this.rulingForm.get('idEjecutivo')!.setValue(this.executives[0].idEjecutivo);
    } catch (error) {
      console.error('Error trying to get executives');
    }

    try {
      this.officials = await lastValueFrom(this.officialService.getActive());
      if (this.officials.length > 0) this.rulingForm.get('idFuncionario')!.setValue(this.officials[0].idFuncionario);
    } catch (error) {
      console.error('Error trying to get officials');
    }
  }

  async loadRequests() {
    this.requests = [];
    if (!this.rulingForm.get('idCliente')!.value) return;
    try {
      if (this.isEdit) {
        this.requests = await lastValueFrom(this.rulingService.getListByClient(this.rulingForm.get('idCliente')!.value));
      } else {
        this.requests = await lastValueFrom(this.rulingService.getListPendingByClient(this.rulingForm.get('idCliente')!.value));
      }
      if (this.requests.length > 0) this.rulingForm.get('idLista')!.setValue(this.ruling.idLista || this.requests[0].idLista);
      if (this.id) this.updateSelectedList();
    } catch (error) {
      console.error('Error trying to get requests');
    }
  }

  updateSelectedList() {
    const selectedList = this.rulingForm.get('idLista')!.value;
    const selectedRequest = this.requests.filter(r => r.idLista === selectedList)[0];
    
    this.rulingForm.get('tipoServicio')!.setValue(selectedRequest.tipoServicio ? '1' : '0');
    this.rulingForm.get('dictaminacion')!.setValue(selectedRequest.dictaminacion == 'C' ? 'CUMPLE' : 'NO CUMPLE');
  }

  updateForm(ruling: Ruling): void {
    this.rulingForm.patchValue({
      idDictamen: ruling.idDictamen,
      idCliente: ruling.idCliente,
      idLista: ruling.idLista,
      folio: ruling.folio,
      dictaminacion: ruling.dictaminacion,
      fDictamen: ruling.fDictamen,
      idFuncionario: ruling.idFuncionario,
      idEjecutivo: ruling.idEjecutivo,
      observaciones: ruling.observaciones,
      clave: ruling.clave,
      tipoServicio: ruling.tipoServicio ? '1' : '0'
    });

    this.ruling = ruling;

    this.loadRequests();
  }

  onSubmit(): void {
    this.rulingForm.markAllAsTouched();
    if (!this.rulingForm.valid) return;

    let rulingRequest = { ...this.ruling, ...this.rulingForm.getRawValue() };
    rulingRequest.tipoServicio = rulingRequest.tipoServicio === '1';

    if (!this.id) {
      const selectedList = this.rulingForm.get('idLista')!.value;
      const selectedRequest = this.requests.filter(r => r.idLista === selectedList)[0];

      rulingRequest.idNorma = selectedRequest.idNorma;
    }

    this.rulingService.save(rulingRequest)
      .pipe()
      .subscribe({
        next: (response) => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'success', message: `El dictamen ${rulingRequest.idDictamen} fue guardado con éxito` },
          })
            .afterClosed()
            .subscribe((confirmado: Boolean) => {
              this.router.navigate([`/secure/rulings`]);
            });
        },
        error: () => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'error', message: `Error al guardar el dictamen ${rulingRequest.idDictamen}` },
          });
          console.error('Error trying to save ruling');
        }
      });
  }

  downloadFile(type: number): void {
    this.documentService.downloadRuling(this.id, type).subscribe(response => {
      saveFile(response.body, this.documentService.getAttachmentFilename(`Dictamen-${this.ruling.clave}.pdf`, response.headers.get('Content-Disposition')),
        response.headers.get('Content-Type') || 'application/octet-stream');
    });
  }

  get form() {
    return this.rulingForm.controls;
  }

  protected filterClients() {
    if (!this.clients) {
      return;
    }
    let search = this.rulingForm.get('clientFilter')!.value;
    if (!search) {
      this.filteredClients.next(this.clients.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    this.filteredClients.next(
      this.clients.filter(client => client.nombre!.toLowerCase().indexOf(search!) > -1)
    );
  }
}