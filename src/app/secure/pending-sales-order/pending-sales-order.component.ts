import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ClientService } from 'src/app/_shared/services/client.service';
import { Warehouse, WarehouseService } from 'src/app/_shared/services/warehouse.service';
import { formatDateString } from 'src/app/_shared/utils/logistic.utils';
import { PendingSales, PendingSalesService } from './pending-sales.service';
import { Service, ServiceService } from 'src/app/_shared/services/service.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Parameter, ParameterService } from 'src/app/_shared/services/parameter.service';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { Client } from 'src/app/_shared/models/client.model';

@Component({
  selector: 'pending-sales-order',
  templateUrl: './pending-sales-order.component.html',
  styleUrls: ['./pending-sales-order.component.scss'],
})
export class PendingSalesOrderComponent implements OnInit {
  displayedColumns: string[] = [
    'almacen',
    'cliente',
    'servicio',
    'fEmision',
    'cantidad',
    'unidad',
    'cuota',
    'referencia',
    'idOrdenServicio',
    'select'
  ];
  searchForm!: FormGroup;
  tipoOrdenControl!: FormControl;
  services: Service[] = [];
  clients: Client[] = [];
  tiposOrden: Parameter[] = [];
  warehouses: Warehouse[] = [];
  dataSource: MatTableDataSource<PendingSales> = new MatTableDataSource();
  selection = new SelectionModel<any>(true, []);

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  constructor(
    private pendingSalesService: PendingSalesService,
    private dialog: MatDialog,
    private clientService: ClientService,
    private warehouseService: WarehouseService,
    private parameterService: ParameterService,
    private serviceService: ServiceService
  ) { }


  ngOnInit() {
    this.searchForm = new FormGroup({
      idServicio: new FormControl('', []),
      fechaDel: new FormControl('', []),
      fechaAl: new FormControl('', []),
      idCliente: new FormControl('', [Validators.required]),
      idBodega: new FormControl(''),
      pendientes: new FormControl(true, []),
    });

    this.tipoOrdenControl = new FormControl('', [Validators.required]);

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

      this.parameterService.searchByTipo({tipo: 'ORDENVENTA'})
        .pipe()
        .subscribe({
          next: (response) => {
            this.tiposOrden = response;
            if (this.tiposOrden.length) {
              this.tipoOrdenControl.setValue(this.tiposOrden[0].valor);
            }
          },
          error: () => {
            console.error('Error trying to get tipos orden');
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
    request.idServicio = request.idServicio || 0;
    request.pendientes = request.pendientes || false;

    this.pendingSalesService.search(request).
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

  resetData() {
    this.dataSource.data = [];
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.selection.clear();
  }

  onSubmit() {
    if (!this.tipoOrdenControl.valid) return;

    const request = { tipoFactura: this.tipoOrdenControl.value, detalle: this.selection.selected};

    const selectedClient = this.clients.filter(c => c.idCliente === this.searchForm.get('idCliente')?.value)[0];

    request.detalle.forEach(d => {
      d.serie = selectedClient.aplicaIva ? 'F' : 'O';
    });

    this.pendingSalesService.generate(request).
      pipe()
      .subscribe({
        next: (response) => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'success', message: `Orden ${response[0].retorno} generada correctamente` },
          });
          this.selection.clear();
          this.onSearch();
        },
        error: () => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'error', message: 'Error al generar la orden' },
          });
          console.error('Error trying to generate order');
        }
      });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.filter(d => d.cuota === 'OK').length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();

      return;
    }

    this.selection.select(...this.dataSource.data.filter(d => d.cuota === 'OK'));
  }

  toggleRow(row: any) {
    this.selection.toggle(row);
  }

  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'Deselecciona' : 'Selecciona'} todos`;
    }
    return `${this.selection.isSelected(row) ? 'Deselecciona' : 'Selecciona'} row ${row.folio}`;
  }

  get form() {
    return this.searchForm.controls;
  }
}
