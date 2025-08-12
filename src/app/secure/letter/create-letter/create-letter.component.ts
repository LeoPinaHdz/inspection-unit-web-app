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
import { StandardService } from 'src/app/_shared/services/standard.service';
import { Letter, LetterDetail } from 'src/app/_shared/models/letter.model';
import { LetterService } from 'src/app/_shared/services/letter.service';
import { ExecutiveService } from 'src/app/_shared/services/executive.service';
import { RequestService } from 'src/app/_shared/services/request.service';
import { SelectionModel } from '@angular/cdk/collections';
import { OfficialService } from 'src/app/_shared/services/official.service';
import { saveFile } from 'src/app/_shared/utils/file.utils';
import { DocumentService } from 'src/app/_shared/services/documents.service';

@Component({
  selector: 'create-letter',
  templateUrl: './create-letter.component.html',
})
export class CreateLetterComponent implements OnInit, OnDestroy {
  letterForm!: FormGroup;
  isEdit = false;
  id: any;
  letter: Letter = { idOficio: 0, idEstatus: 1 };
  selectedDetail?: LetterDetail;
  letterDetails: any[] = [];
  imports: string[] = [];
  clients: Client[] = [];
  filteredClients: ReplaySubject<Client[]> = new ReplaySubject<Client[]>(1);
  standards: any[] = [];
  executives: any[] = [];
  allExecutives: any[] = [];
  officials: any[] = [];
  displayedColumns: string[] = ['select', 'clave', 'fSolicitudFmt'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  _onDestroy = new Subject<void>();
  selection = new SelectionModel<any>(true, []);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private letterService: LetterService,
    private officialService: OfficialService,
    private clientService: ClientService,
    private executiveService: ExecutiveService,
    private standardService: StandardService,
    private dialog: MatDialog,
    private requestService: RequestService,
    private documentService: DocumentService
  ) { }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');

    this.letterForm = new FormGroup({
      idOficio: new FormControl({ value: '', disabled: true }, []),
      idCliente: new FormControl('', [Validators.required]),
      clientFilter: new FormControl('', []),
      idNorma: new FormControl('', []),
      folio: new FormControl({ value: '', disabled: true }),
      fOficio: new FormControl({ value: new Date(), disabled: false }, [Validators.required]),
      fPresentacion: new FormControl({ value: new Date(), disabled: false }, [Validators.required]),
      hPresentacion: new FormControl('', []),
      observaciones: new FormControl('', [Validators.required, Validators.maxLength(250)]),
      idEjecutivo: new FormControl('', [Validators.required]),
      idFuncionario: new FormControl('', [Validators.required]),
      clave: new FormControl('', []),
      solicitudPor: new FormControl('0', [Validators.required]),
      pedimento: new FormControl('', [])
    });

    this.letterForm.get('pedimento')!.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.loadRequests();
      });

    this.letterForm.get('solicitudPor')!.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.loadRequests();
      });

    try {
      this.standards = await lastValueFrom(this.standardService.getAllActive());
      if (this.standards.length > 0) this.letterForm.get('idNorma')!.setValue(this.standards[0].idNorma);

      this.letterForm.get('idNorma')!.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.loadRequests();
          this.loadExecutive();
        });
    } catch (error) {
      console.error('Error trying to get standards');
    }

    try {
      this.clients = await lastValueFrom(this.clientService.getAllActive());
      if (this.clients.length > 0) this.letterForm.get('idCliente')!.setValue(this.clients[0].idCliente);
      this.filteredClients.next(this.clients.slice());

      this.letterForm.get('idCliente')!.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.loadRequests();
          this.loadImports();
        });

      this.loadImports();
      this.loadRequests();

      this.letterForm.get('clientFilter')!.valueChanges
        .pipe(takeUntil(this._onDestroy))
        .subscribe(() => {
          this.filterClients();
        });
    } catch (error) {
      console.error('Error trying to get clients');
    }

    try {
      this.allExecutives = await lastValueFrom(this.executiveService.getActive());
      if (this.allExecutives.length > 0) this.letterForm.get('idFuncionario')!.setValue(this.allExecutives[0].idEjecutivo);
    } catch (error) {
      console.error('Error trying to get all executives');
    }

    if (this.id) {
      this.isEdit = true;

      this.letterService.getById(this.id)
        .pipe()
        .subscribe({
          next: (response) => {
            this.updateForm(response);
          },
          error: () => {
            this.dialog.open(SimpleDialogComponent, {
              data: { type: 'error', message: `Error al obtener los datos del oficio ${this.id}` },
            })
              .afterClosed()
              .subscribe(() => {
                this.router.navigate([`/secure/letters`]);
              });
            console.error('Error trying to get letter create');
          }
        });
    }
  }

  loadExecutive() {
    this.executives = [];
    if (this.letterForm.get('idNorma')!.invalid) return;
    this.executiveService.getByStandard(this.letterForm.get('idNorma')!.value)
      .pipe()
      .subscribe({
        next: (response) => {
          this.executives = response;
          if (this.executives.length > 0 && !this.isEdit) this.letterForm.get('idEjecutivo')!.setValue(this.executives[0].idEjecutivo);
        },
        error: () => {
          console.error('Error trying to get executives');
        }
      });
  }

  async loadRequests() {
    if (this.letterForm.get('solicitudPor')!.value == '0') {
      if (!this.letterForm.get('idCliente')!.value || !this.letterForm.get('idNorma')!.value) return;

      try {
        this.letterDetails = await lastValueFrom(this.requestService.getByClientAndStandard(this.letterForm.get('idCliente')!.value, this.letterForm.get('idNorma')!.value));

        this.dataSource = new MatTableDataSource(this.letterDetails);
        this.updateSelection();
      } catch (error) {
        console.error('Error trying to get requests by standard');
      }
    } else {
      if (!this.letterForm.get('idCliente')!.value || !this.letterForm.get('pedimento')!.value) return;

      try {
        this.letterDetails = await lastValueFrom(this.requestService.getByClientAndImport(this.letterForm.get('idCliente')!.value, this.letterForm.get('pedimento')!.value));

        this.dataSource = new MatTableDataSource(this.letterDetails);
        this.updateSelection();
      } catch (error) {
        console.error('Error trying to get requests by import');
      }
    }
  }

  loadImports() {
    this.requestService.getImportsByClient(this.letterForm.get('idCliente')!.value)
      .pipe()
      .subscribe({
        next: (response) => {
          this.imports = response;
        },
        error: () => {
          console.error('Error trying to get addresses');
        }
      });
  }

  onSubmit(): void {
    this.letterForm.markAllAsTouched();
    if (!this.letterForm.valid || this.selection.isEmpty()) return;

    let request = { ...this.letter, ...this.letterForm.getRawValue() };

    request.oficio = request.oficio && request.oficio > 0 ? request.oficio : 0;
    request.folio = request.folio && request.folio > 0 ? request.folio : 0;
    request.detalles = this.selection.selected.map(r => {
      return { idSolicitud: r.idSolicitud };
    });

    this.letterService.save(request)
      .pipe()
      .subscribe({
        next: (response) => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'success', message: `El oficio ${request.idOficio} fue guardado con éxito` },
          })
            .afterClosed()
            .subscribe((confirmado: Boolean) => {
              this.router.navigate([`/secure/letters`]);
            });
        },
        error: () => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'error', message: `Error al guardar el oficio ${request.idOficio}` },
          });
          console.error('Error trying to save letters');
        }
      });
  }

  updateForm(letter: Letter): void {
    this.letterForm.patchValue(letter);
    this.letterForm.patchValue({
      solicitudPor: `${letter.solicitudPor}`,
    });

    this.letter = letter;

    this.updateSelection(true);
  }

  async updateSelection(update = false) {
    if (this.letter.detalles) {

      if (update) {
        this.letter.detalles
          .forEach(async (d) => {
            if (d.idSolicitud && !this.letterDetails.some(ld => ld.idSolicitud == d.idSolicitud)) {
              try {
                const letter = await lastValueFrom(this.requestService.getById(d.idSolicitud));

                this.letterDetails = [letter, ...this.letterDetails];

                this.dataSource = new MatTableDataSource(this.letterDetails);
                const selected = this.letterDetails.filter(ld =>
                  this.letter.detalles!.some(d => d.idSolicitud === ld.idSolicitud)
                );
                this.selection.clear();
                this.selection.select(...selected);
              } catch (error) {
                console.error('Error trying to get requests by import');
              }
            }
          });
      } else {
        this.dataSource = new MatTableDataSource(this.letterDetails);
        const selected = this.letterDetails.filter(ld =>
          this.letter.detalles!.some(d => d.idSolicitud === ld.idSolicitud)
        );
        this.selection.clear();
        this.selection.select(...selected);
      }
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'Deselecciona' : 'Selecciona'} todos`;
    }
    return `${this.selection.isSelected(row) ? 'Deselecciona' : 'Selecciona'} row ${row.folio}`;
  }

  downloadFile(type: number): void {
    this.documentService.downloadLetter(this.id, type).subscribe(response => {
      saveFile(response.body, this.documentService.getAttachmentFilename(`Oficio-${this.letter.clave}.pdf`, response.headers.get('Content-Disposition')),
        response.headers.get('Content-Type') || 'application/octet-stream');
    });
  }

  private filterClients() {
    if (!this.clients) {
      return;
    }
    let search = this.letterForm.get('clientFilter')!.value;
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
    return this.letterForm.controls;
  }
}
