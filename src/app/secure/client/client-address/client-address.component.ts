import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ClientAddressService } from 'src/app/_shared/services/client-address.service';
import { ClientAddress } from 'src/app/_shared/models/client-address.model';
import { Client } from 'src/app/_shared/models/client.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';

@Component({
  selector: 'client-address',
  templateUrl: './client-address.component.html'
})

export class ClientAddressComponent implements OnInit, OnChanges {
  @Input() client: Client = { idCliente: 0 };
  @Input() countries: any[] = [];
  @Input() states: any[] = [];
  isListMode = true;
  displayedColumns: string[] = [
    'nombre',
    'idEstatus',
    'calle',
    'numero',
    'prioridad',
    'action'
  ];
  dataSource: MatTableDataSource<ClientAddress> = new MatTableDataSource();
  clientAddressForm!: FormGroup;

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  constructor(
    private clientAddressService: ClientAddressService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.clientAddressForm = new FormGroup({
      idLugar: new FormControl({ value: '', disabled: true }, []),
      nombre: new FormControl('', [Validators.required]),
      calle: new FormControl('', [Validators.required]),
      numero: new FormControl(''),
      colonia: new FormControl(''),
      municipio: new FormControl('', [Validators.required]),
      idEstado: new FormControl('', [Validators.required]),
      idPais: new FormControl('', [Validators.required]),
      cp: new FormControl('', [Validators.required]),
      idBodega: new FormControl(''),
      prioridad: new FormControl(false, [Validators.required]),
      tipoDeposito: new FormControl('', [Validators.required]),
      active: new FormControl(false, [Validators.required])
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.client && this.client.idCliente !== 0) {
      this.loadAllClientAddresss(this.client.idCliente);
    }
    if (changes.countries && this.countries.length > 0 && !this.clientAddressForm.get('idPais')!.value) {
      this.clientAddressForm.get('idPais')!.setValue(this.countries[0].idPais);
    }
    if (changes.states && this.states.length > 0 && !this.clientAddressForm.get('idEstado')!.value) {
      this.clientAddressForm.get('idEstado')!.setValue(this.states[0].idEstado);
    }
  }

  loadAllClientAddresss(id: number) {
    this.clientAddressService.getAll(id).
      pipe()
      .subscribe({
        next: (response) => {
          this.dataSource = new MatTableDataSource(response);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        },
        error: () => {
          console.error('Error trying to get client-address list');
        }
      });
  }

  onSubmit(): void {
    this.clientAddressForm.markAllAsTouched();
    console.log(this.clientAddressForm);
    console.log(this.clientAddressForm.valid);
    if (!this.clientAddressForm.valid) return;

    const clientAddressRequest = this.clientAddressForm.getRawValue();
    clientAddressRequest.idEstatus = clientAddressRequest.active ? 1 : 4;
    clientAddressRequest.prioridad = clientAddressRequest.prioridad ? 1 : 0;
    clientAddressRequest.idCliente = clientAddressRequest.idCliente || this.client.idCliente;

    this.clientAddressService.save(clientAddressRequest)
      .pipe()
      .subscribe({
        next: (response) => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'success', message: `La dirección ${clientAddressRequest.idLugar || ''} fue guardada con éxito` },
          })
            .afterClosed()
            .subscribe((confirmado: Boolean) => {
              this.isListMode = !this.isListMode;
              this.clientAddressForm.reset({active: false, prioridad: false});
              this.loadAllClientAddresss(this.client.idCliente);
            });
        },
        error: () => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'error', message: `Error al guardar la dirección ${clientAddressRequest.idLugar || ''}` },
          });
          console.error('Error trying to save client');
        }
      });
  }

  onCancel(): void {
    this.isListMode = true;
    this.clientAddressForm.reset({active: false, prioridad: false});
  }

  onEditAddress(clientAddress: ClientAddress): void {
    this.updateForm(clientAddress);
    this.isListMode = !this.isListMode;
  }

  updateForm(clientAddress: ClientAddress): void {
    this.clientAddressForm.patchValue(clientAddress);
    this.clientAddressForm.patchValue({
      tipoDeposito: `${clientAddress.tipoDeposito}`,
      prioridad: (clientAddress.prioridad && clientAddress.prioridad === 1) || false,
      active: (clientAddress.idEstatus && clientAddress.idEstatus === 1) || false
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}