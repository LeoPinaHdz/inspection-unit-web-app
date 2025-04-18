import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, lastValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { ClientService } from 'src/app/_shared/services/client.service';
import { Client } from 'src/app/_shared/models/client.model';
import { PromoterService } from 'src/app/_shared/services/promoter.service';
import { ExecutiveService } from 'src/app/_shared/services/executive.service';

@Component({
  selector: 'client-detail',
  templateUrl: './client-detail.component.html',
})
export class ClientDetailComponent implements OnInit, OnDestroy, OnChanges {
  @Input() client: Client = { idCliente: 0 };
  @Input() isEdit: Boolean = false;
  @Input() countries: any[] = [];
  @Input() states: any[] = [];
  id: any;
  promoters: any[] = [];
  executives: any[] = [];
  clientForm!: FormGroup;
  _onDestroy = new Subject<void>();
  allClientsSelected: boolean = false;
  allWarehousesSelected: boolean = false;
  allScreensSelected: boolean = false;

  constructor(
    private router: Router,
    private clientService: ClientService,
    private promoterService: PromoterService,
    private dialog: MatDialog,
    private executiveService: ExecutiveService
  ) {
    this.clientForm = new FormGroup({
      idCliente: new FormControl({ value: '', disabled: true }, []),
      nombre: new FormControl('', [Validators.required]),
      rfc: new FormControl('', [Validators.required]),
      calle: new FormControl('', [Validators.required]),
      exterior: new FormControl(''),
      interior: new FormControl(''),
      colonia: new FormControl(''),
      cp: new FormControl(''),
      municipio: new FormControl(''),
      idEstado: new FormControl('', [Validators.required]),
      idPais: new FormControl('', [Validators.required]),
      telefono: new FormControl(''),
      email: new FormControl(''),
      persona: new FormControl('', [Validators.required]),
      tipoMunicipio: new FormControl('', [Validators.required]),
      idPromotor: new FormControl('', [Validators.required]),
      idEjecutivo: new FormControl(''),
      active: new FormControl(false, [Validators.required])
    });
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  async ngOnInit() {
    try {
      this.promoters = await lastValueFrom(this.promoterService.getActive());
      if (!this.isEdit && this.promoters.length > 0) this.clientForm.get('idPromotor')!.setValue(this.promoters[0].idPromotor);
    } catch (error) {
      console.error('Error trying to get promoters');
    }

    try {
      this.executives = await lastValueFrom(this.executiveService.getActive());
      if (!this.isEdit && this.executives.length > 0) this.clientForm.get('idEjecutivo')!.setValue(this.executives[0].idEjecutivo);
    } catch (error) {
      console.error('Error trying to get executives');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.client && this.client.idCliente !== 0) {
      this.updateForm(this.client);
    }
    if (changes.countries && this.isEdit && this.countries.length > 0) {
      this.clientForm.get('idPais')!.setValue(this.countries[0].idPais);
    }
    if (changes.states && this.isEdit && this.states.length > 0) {
      this.clientForm.get('idEstado')!.setValue(this.states[0].idEstado);
    }
  }

  updateForm(client: Client): void {
    this.clientForm.patchValue({
      idCliente: client.idCliente,
      rfc: client.rfc,
      nombre: client.nombre,
      calle: client.calle,
      exterior: client.exterior,
      interior: client.interior,
      colonia: client.colonia,
      cp: client.cp,
      municipio: client.municipio,
      idEstado: client.idEstado,
      idPais: client.idPais,
      telefono: client.telefono,
      email: client.email,
      idEstatus: client.idEstatus,
      persona: `${client.persona}`,
      tipoMunicipio: `${client.tipoMunicipio ? 0 : 1}`,
      idPromotor: client.idPromotor,
      idEjecutivo: client.idEjecutivo,
      active: (client.idEstatus && client.idEstatus === 1) || false
    });
    this.client = client;
  }

  onSubmit(): void {
    this.clientForm.markAllAsTouched();

    if (!this.clientForm.valid) return;

    const clientRequest = this.clientForm.getRawValue();
    clientRequest.idEstatus = clientRequest.active ? 1 : 4;
    clientRequest.tipoMunicipio = clientRequest.tipoMunicipio === '0';

    this.clientService.save(clientRequest)
      .pipe()
      .subscribe({
        next: (response) => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'success', message: `El cliente ${clientRequest.idCliente} fue guardado con éxito` },
          })
            .afterClosed()
            .subscribe((confirmado: Boolean) => {
              if (!this.isEdit) {
                this.router.navigate(['/secure/client', response.idCliente]);
              }
            });
        },
        error: () => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'error', message: `Error al guardar el cliente ${clientRequest.idCliente}` },
          });
          console.error('Error trying to save client');
        }
      });
  }
}