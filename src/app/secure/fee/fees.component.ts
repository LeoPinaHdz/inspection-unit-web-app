import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ClientService } from 'src/app/_shared/services/client.service';
import { Warehouse, WarehouseService } from 'src/app/_shared/services/warehouse.service';
import { formatDateString } from 'src/app/_shared/utils/logistic.utils';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ConfirmationDialogComponent } from 'src/app/_shared/components/confirmation-dialog/confirmation-dialog.component';
import { Fee, FeeService } from 'src/app/_shared/services/fee.service';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { Client } from 'src/app/_shared/models/client.model';

@Component({
  selector: 'fees',
  templateUrl: './fees.component.html'
})
export class FeesComponent implements OnInit {
  displayedColumns: string[] = [
    'idCuota',
    'cliente',
    'servicio',
    'fVigenciaIni',
    'fVigenciaFin',
    'cuota',
    'aplicaIva',
    'estatus',
    'action'
  ];
  searchForm!: FormGroup;
  clients: Client[] = [];
  warehouses: Warehouse[] = [];
  dataSource: MatTableDataSource<Fee> = new MatTableDataSource();

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  constructor(
    private feeService: FeeService,
    private dialog: MatDialog,
    private clientService: ClientService,
    private warehouseService: WarehouseService
  ) { }


  ngOnInit() {
    this.searchForm = new FormGroup({
      fechaDel: new FormControl('', []),
      fechaAl: new FormControl('', []),
      idCliente: new FormControl('', [Validators.required]),
      idBodega: new FormControl('', [Validators.required]),
      cancelados: new FormControl(false, []),
    });

    this.clientService.getAllActive()
      .pipe()
      .subscribe({
        next: (response) => {
          this.clients = response;
          if (this.clients.length) {
            this.searchForm.get('idCliente')!.setValue(this.clients[0].idCliente);
            if (this.clients.length === 1) this.searchForm.get('idCliente')!.disable();
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
            this.searchForm.get('idBodega')!.setValue(this.warehouses[0].idBodega);
            if (this.warehouses.length === 1) this.searchForm.get('idBodega')!.disable();
          }
        },
        error: () => {
          console.error('Error trying to get warehouses');
        }
      });
  }

  onSearch() {
    const request = this.searchForm.getRawValue();

    request.fechaDel = request.fechaDel ? formatDateString(request.fechaDel) : '';
    request.fechaAl = request.fechaAl ? formatDateString(request.fechaAl) : '';

    this.feeService.search(request).
      pipe()
      .subscribe({
        next: (response) => {
          this.dataSource = new MatTableDataSource(response);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        },
        error: () => {
          console.error('Error to get pending sales order list');
        }
      });
  }

  showConfirmDialog(idCuota: number, idEstatus: number): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: `¿Esta seguro que desea ${idEstatus === 3 ? 'cancelar' : 'autorizar'} la cuota ${idCuota}?`,
    })
      .afterClosed()
      .subscribe((confirmado: Boolean) => {
        if (confirmado) {
          const fee = { idCuota, idEstatus };

          this.feeService.updateStatus(fee)
            .pipe()
            .subscribe({
              next: (response) => {
                this.dialog.open(SimpleDialogComponent, {
                  data: { type: 'success', message: `La cuota ${idCuota} fue actualizado con éxito` },
                })
                  .afterClosed()
                  .subscribe(() => {
                    this.onSearch();
                  });
              },
              error: () => {
                this.dialog.open(SimpleDialogComponent, {
                  data: { type: 'error', message: `Ocurrio un error al actualizar la cuota ${idCuota}` },
                });
                console.error('Error trying to update fee');
              }
            });
        }
      });
  }

  get form() {
    return this.searchForm.controls;
  }
}
