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
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { OrderService, OrderServiceService } from './order-service.service';
import { Client } from 'src/app/_shared/models/client.model';

@Component({
  selector: 'order-service',
  templateUrl: './order-service.component.html'
})
export class OrderServicesComponent implements OnInit {
  displayedColumns: string[] = [
    'idOrdenServicio',
    'bodega',
    'cliente',
    'fServicio',
    'estatus',
    'action'
  ];
  searchForm!: FormGroup;
  clients: Client[] = [];
  warehouses: Warehouse[] = [];
  dataSource: MatTableDataSource<OrderService> = new MatTableDataSource();

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  constructor(
    private orderServiceService: OrderServiceService,
    private dialog: MatDialog,
    private clientService: ClientService,
    private warehouseService: WarehouseService
  ) { }


  ngOnInit() {
    this.searchForm = new FormGroup({
      fechaDel: new FormControl('', []),
      fechaAl: new FormControl('', []),
      idCliente: new FormControl('', [Validators.required]),
      idBodega: new FormControl(''),
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
    if (!this.searchForm.valid) return;

    request.fechaDel = request.fechaDel ? formatDateString(request.fechaDel) : '';
    request.fechaAl = request.fechaAl ? formatDateString(request.fechaAl) : '';

    this.orderServiceService.search(request).
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

  showConfirmDialog(idOrdenServicio: number, idEstatus: number): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: `¿Esta seguro que desea ${idEstatus === 3 ? 'cancelar' : 'autorizar'} el servicio ${idOrdenServicio}?`,
    })
      .afterClosed()
      .subscribe((confirmado: Boolean) => {
        if (confirmado) {
          const orderService = { idOrdenServicio, idEstatus };

          this.orderServiceService.updateStatus(orderService)
            .pipe()
            .subscribe({
              next: (response) => {
                this.dialog.open(SimpleDialogComponent, {
                  data: { type: 'success', message: `El servicio ${idOrdenServicio} fue actualizado con éxito` },
                })
                  .afterClosed()
                  .subscribe(() => {
                    this.onSearch();
                  });
              },
              error: () => {
                this.dialog.open(SimpleDialogComponent, {
                  data: { type: 'error', message: `Ocurrio un error al actualizar el servicio ${idOrdenServicio}` },
                });
                console.error('Error trying to update orderService');
              }
            });
        }
      });
  }

  get form() {
    return this.searchForm.controls;
  }
}
