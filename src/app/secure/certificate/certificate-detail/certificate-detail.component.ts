import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReplaySubject, Subject, lastValueFrom, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { CertificateService } from 'src/app/_shared/services/certificate.service';
import { Certificate } from 'src/app/_shared/models/certificate.model';
import { ClientService } from 'src/app/_shared/services/client.service';
import { Client } from 'src/app/_shared/models/client.model';
import { LetterService } from 'src/app/_shared/services/letter.service';
import { RequestService } from 'src/app/_shared/services/request.service';
import { Letter } from 'src/app/_shared/models/letter.model';
import { Request } from 'src/app/_shared/models/request.model';
import { saveFile } from 'src/app/_shared/utils/file.utils';
import { DocumentService } from 'src/app/_shared/services/documents.service';
import { ExecutiveService } from 'src/app/_shared/services/executive.service';

@Component({
  selector: 'certificates',
  templateUrl: './certificate-detail.component.html',
})
export class CertificateDetailComponent implements OnInit, OnDestroy {
  id: any;
  isEdit = false;
  certificate: Certificate = { idActa: 0, idEstatus: 1 };
  clients: Client[] = [];
  letters: Letter[] = [];
  allExecutives: any[] = [];
  requests: Request[] = [];
  certificateForm!: FormGroup;
  _onDestroy = new Subject<void>();
  filteredClients: ReplaySubject<Client[]> = new ReplaySubject<Client[]>(1);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clientService: ClientService,
    private certificateService: CertificateService,
    private letterService: LetterService,
    private requestService: RequestService,
    private executiveService: ExecutiveService,
    private documentService: DocumentService,
    private dialog: MatDialog
  ) { }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');

    this.certificateForm = new FormGroup({
      idActa: new FormControl({ value: '', disabled: true }, []),
      folio: new FormControl({ value: '', disabled: true }, []),
      idCliente: new FormControl('', [Validators.required]),
      clientFilter: new FormControl('', []),
      idOficio: new FormControl('', [Validators.required]),
      idSolicitud: new FormControl('', [Validators.required]),
      idEjecutivo: new FormControl('', [Validators.required]),
      fIniActa: new FormControl('', [Validators.required]),
      hIniActa: new FormControl('', [Validators.required]),
      fFinActa: new FormControl('', [Validators.required]),
      hFinActa: new FormControl('', [Validators.required]),
      otroServicio: new FormControl(false),
      cual: new FormControl('', [Validators.maxLength(100)]),
      tipoLote: new FormControl('1', [Validators.required]),
      cantidad: new FormControl(0, [Validators.maxLength(20)]),
      instrumento: new FormControl('', [Validators.maxLength(100)]),
      estadoInstrumento: new FormControl('', [Validators.maxLength(100)]),
      factura: new FormControl('', [Validators.required, Validators.maxLength(200)]),
      lote: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      muestra: new FormControl('', [Validators.required, Validators.maxLength(50)]),
      manifiesto: new FormControl('', [Validators.required, Validators.maxLength(500)]),
      resultado: new FormControl('', [Validators.required, Validators.maxLength(250)]),
      observaciones: new FormControl('', [Validators.required, Validators.maxLength(255)])
    });

    this.certificateForm.get('idOficio')!.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.loadRequests();
      });

    try {
      this.allExecutives = await lastValueFrom(this.executiveService.getActive());
      if (this.allExecutives.length > 0) this.certificateForm.get('idEjecutivo')!.setValue(this.allExecutives[0].idEjecutivo);
    } catch (error) {
      console.error('Error trying to get all executives');
    }

    try {
      this.clients = await lastValueFrom(this.clientService.getAllActive());
      if (this.clients.length > 0 && !this.id) this.certificateForm.get('idCliente')!.setValue(this.clients[0].idCliente);
      this.filteredClients.next(this.clients.slice());


      this.certificateForm.get('idCliente')!.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.loadLetters();
        });

      if (!this.id) this.loadLetters();

      this.certificateForm.get('clientFilter')!.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.filterClients();
        });
    } catch (error) {
      console.error('Error trying to get clients');
    }

    if (this.id) {
      this.isEdit = true;

      this.certificateService.getById(this.id)
        .pipe()
        .subscribe({
          next: (response) => {
            this.updateForm(response);

            if (response.idOficio) {
              this.letterService.getById(response.idOficio)
                .pipe()
                .subscribe({
                  next: (response) => {
                    this.letters = [response, ...this.letters];
                  },
                  error: () => {
                    console.error('Error trying to get letter detail');
                  }
                });
              }
          },
          error: () => {
            this.dialog.open(SimpleDialogComponent, {
              data: { type: 'error', message: `Error al obtener los datos del acta ${this.id}` },
            })
              .afterClosed()
              .subscribe(() => {
                this.router.navigate([`/secure/certificates`]);
              });
            console.error('Error trying to get certificate detail');
          }
        });
    }
  }

  async loadLetters(isFirstTime = false) {
    this.letters = [];
    try {
      this.letters = await lastValueFrom(this.letterService.getByClient(this.certificateForm.get('idCliente')!.value));
      if (this.letters.length > 0 && !this.id) this.certificateForm.get('idOficio')!.setValue(this.letters[0].idOficio);
      if (this.letters.length === 0) this.certificateForm.get('idOficio')!.setValue('');
    } catch (error) {
      console.error('Error trying to get letters');
    }
  }

  async loadRequests() {
    this.requests = [];
    if (!this.certificateForm.get('idOficio')!.value) return;
    try {
      this.requests = await lastValueFrom(this.requestService.getByLetter(this.certificateForm.get('idOficio')!.value));
      if (this.requests.length > 0 && !this.id) this.certificateForm.get('idSolicitud')!.setValue(this.requests[0].idSolicitud);
    } catch (error) {
      console.error('Error trying to get requests');
    }
  }

  updateForm(certificate: Certificate): void {
    this.certificateForm.patchValue(certificate);

    this.loadLetters();

    this.certificate = certificate;
  }

  onSubmit(): void {
    this.certificateForm.markAllAsTouched();
    if (!this.certificateForm.valid) return;

    const form = this.certificateForm.getRawValue();
    const certificateRequest = { ...this.certificate, ...form }
    certificateRequest.folio = certificateRequest.folio && certificateRequest.folio > 0 ? certificateRequest.folio : 0;

    this.certificateService.save(certificateRequest)
      .pipe()
      .subscribe({
        next: (response) => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'success', message: `Acta ${this.formatWithLeadingZeros(response)} guardada con éxito` },
          })
            .afterClosed()
            .subscribe((confirmado: Boolean) => {
              this.router.navigate([`/secure/certificates`]);
            });
        },
        error: () => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'error', message: `Error al guardar acta ${this.isEdit ? certificateRequest.folio : ''}` },
          });
          console.error('Error trying to save certificate');
        }
      });
  }

  formatWithLeadingZeros(param: any) {
    return param.folio ? param.folio.toString().padStart(5, '0') : param.idActa;
  }

  downloadFile(type: number): void {
    this.documentService.downloadCertificate(this.id, type).subscribe(response => {
      saveFile(response.body, this.documentService.getAttachmentFilename(`Acta-${this.certificate.folio}.pdf`, response.headers.get('Content-Disposition')),
        response.headers.get('Content-Type') || 'application/octet-stream');
    });
  }

  private filterClients() {
    if (!this.clients) {
      return;
    }
    let search = this.certificateForm.get('clientFilter')!.value;
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
    return this.certificateForm.controls;
  }
}