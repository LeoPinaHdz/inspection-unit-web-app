import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { ClientService } from 'src/app/_shared/services/client.service';
import { Warehouse, WarehouseService } from 'src/app/_shared/services/warehouse.service';
import { Service, ServiceService } from 'src/app/_shared/services/service.service';
import { Fee, FeeService } from 'src/app/_shared/services/fee.service';
import { addYears } from 'src/app/_shared/utils/logistic.utils';
import { Client } from 'src/app/_shared/models/client.model';

@Component({
  selector: 'fee-detail',
  templateUrl: './fee-detail.component.html',
})
export class FeeDetailComponent implements OnInit {
  formFee!: FormGroup;
  isEdit = false;
  feeId: any;
  fee: Fee = { idCuota: 0, idEstatus: 1 };
  clients: Client[] = [];
  warehouses: Warehouse[] = [];
  services: Service[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private feeService: FeeService,
    private clientService: ClientService,
    private warehouseService: WarehouseService,
    private dialog: MatDialog,
    private serviceService: ServiceService
  ) { }

  ngOnInit() {
    this.feeId = this.route.snapshot.paramMap.get('id');

    this.formFee = new FormGroup({
      idCuota: new FormControl({ value: '', disabled: true }, [Validators.required]),
      idCliente: new FormControl({ value: '', disabled: this.feeId }, [Validators.required]),
      idBodega: new FormControl({ value: '', disabled: this.feeId }, [Validators.required]),
      idServicio: new FormControl('', [Validators.required]),
      fVigenciaIni: new FormControl(new Date(), [Validators.required]),
      fVigenciaFin: new FormControl(addYears(new Date(), 5), [Validators.required]),
      cuota: new FormControl('', [Validators.required]),
      aplicaIva: new FormControl(false, [Validators.required]),
      observaciones: new FormControl('', []),
    });

    if (!this.feeId) {
      this.clientService.getAllActive()
        .pipe()
        .subscribe({
          next: (response) => {
            this.clients = response;
            if (this.clients.length) {
              this.formFee.get('idCliente')!.setValue(this.clients[0].idCliente);
              if (this.clients.length === 1) this.formFee.get('idCliente')!.disable();
            }
          },
          error: () => {
            console.error('Error trying to get clients');
          }
        });
      this.warehouseService.getWarehouses()
        .pipe()
        .subscribe({
          next: (response) => {
            this.warehouses = response;
            if (this.warehouses.length) {
              this.formFee.get('idBodega')!.setValue(this.warehouses[0].idBodega);
              if (this.warehouses.length === 1) this.formFee.get('idBodega')!.disable();
            }
          },
          error: () => {
            console.error('Error trying to get warehouses');
          }
        });
    }

    this.serviceService.getAllActive()
      .pipe()
      .subscribe({
        next: (response) => {
          this.services = response;
        },
        error: () => {
          console.error('Error trying to get services');
        }
      });


    if (this.feeId) {
      this.isEdit = true;

      this.feeService.getById(this.feeId)
        .pipe()
        .subscribe({
          next: (response) => {
            this.updateFeeForm(response);
            if (response.idEstatus !== 1) {
              this.formFee.get('idServicio')!.disable();
              this.formFee.get('fVigenciaIni')!.disable();
              this.formFee.get('fVigenciaFin')!.disable();
              this.formFee.get('cuota')!.disable();
              this.formFee.get('aplicaIva')!.disable();
              this.formFee.get('observaciones')!.disable();
            }
            this.clients = [{ idCliente: response.idCliente || 0, nombre: response.cliente }];
            this.formFee.get('idCliente')!.setValue(response.idCliente);
            this.warehouses = [{ idBodega: response.idBodega || 0, nombre: response.bodega }];
            this.formFee.get('idBodega')!.setValue(response.idBodega);
          },
          error: () => {
            this.dialog.open(SimpleDialogComponent, {
              data: { type: 'error', message: `Error al obtener los datos de la cuota ${this.feeId}` },
            })
              .afterClosed()
              .subscribe(() => {
                this.router.navigate([`/secure/fees`]);
              });
            console.error('Error trying to get fee detail');
          }
        });
    }
  }

  updateFeeForm(fee: Fee): void {
    this.formFee.patchValue({
      idCuota: fee.idCuota,
      cuota: fee.cuota,
      idCliente: fee.idCliente,
      idBodega: fee.idBodega,
      idServicio: fee.idServicio,
      fVigenciaIni: fee.fVigenciaIni,
      fVigenciaFin: fee.fVigenciaFin,
      aplicaIva: fee.aplicaIva,
      observaciones: fee.observaciones,
    });
    this.fee = fee;
  }

  onSubmit(): void {
    this.formFee.markAllAsTouched();
    if (!this.formFee.valid) return;

    const fee: Fee = { ...this.fee, ...this.formFee.getRawValue() };

    this.feeService.save(fee)
      .pipe()
      .subscribe({
        next: (response: any) => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'success', message: `La cuota ${fee.idCuota} fue guardada con éxito` },
          })
            .afterClosed()
            .subscribe((confirmado: Boolean) => {
              this.router.navigate([`/secure/fees`]);
            });
        },
        error: () => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'error', message: `Error al guardar la cuota ${fee.idCuota}` },
          });
          console.error('Error trying to save fee');
        }
      });
  }


  getTotal(): number {
    return 0//this.feeDetails.map(d => Number(d.cantidad) || 0).reduce((acc, value) => acc + value, 0);
  }

  getTotalPiezas(): number {
    return 0//this.feeDetails.map(d => Number(d.pzasxBulto) || 0).reduce((acc, value) => acc + value, 0);
  }

  get form() {
    return this.formFee.controls;
  }
}
