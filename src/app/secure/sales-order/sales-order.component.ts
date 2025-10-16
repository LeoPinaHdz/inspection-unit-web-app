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
import { SalesOrder, SalesOrderService } from './sales-order.service';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { PdfModalComponent } from 'src/app/_shared/components/pdf-modal/pdf-modal.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Client } from 'src/app/_shared/models/client.model';

@Component({
  selector: 'sales-order',
  templateUrl: './sales-order.component.html',
  styleUrls: ['./sales-order.component.scss'],
})
export class SalesOrderComponent implements OnInit {
  displayedColumns: string[] = [
    'idOrden',
    'almacen',
    'cliente',
    'fecha',
    'referencia',
    'subtotal',
    'total',
    'estatus',
    'action'
  ];
  searchForm!: FormGroup;
  clients: Client[] = [];
  warehouses: Warehouse[] = [];
  dataSource: MatTableDataSource<SalesOrder> = new MatTableDataSource();

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;

  constructor(
    private salesOrderService: SalesOrderService,
    private dialog: MatDialog,
    private clientService: ClientService,
    private sanitizer: DomSanitizer,
    private router: Router,
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

    this.patchForm();

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

  patchForm() {
    const filtersObj = sessionStorage.getItem('searchOV');

    if(filtersObj) {
      const filters = JSON.parse(filtersObj);

      sessionStorage.removeItem('searchOV');
      this.searchForm.patchValue(filters);
      this.onSearch();
    }
  }

  viewDetail(id: number) {
    const filters = this.searchForm.getRawValue();
    
    sessionStorage.setItem('searchOV', JSON.stringify(filters));
    this.router.navigate(['/secure/sales-order/', id]);
  }

  onSearch() {
    const request = this.searchForm.getRawValue();
    if (!this.searchForm.valid) return;

    request.fechaDel = request.fechaDel ? formatDateString(request.fechaDel) : '';
    request.fechaAl = request.fechaAl ? formatDateString(request.fechaAl) : '';
    request.cancelados = request.cancelados || false;

    this.salesOrderService.search(request).
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

  printOrder(id: Number) {
    this.salesOrderService.getReporte(id).
      pipe()
      .subscribe({
        next: (response) => {
          if (response && response.length) {
            const pdfContent = this.salesOrderService.generatePdf(response);

            this.openPdfModal(pdfContent);
          }
        },
        error: () => {
          console.error('Error to generate report');
        }
      });
  }

  openPdfModal(pdfBlob: Blob) {
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const safePdfUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrl);

    this.dialog.open(PdfModalComponent, {
      width: '80%',
      data: safePdfUrl
    });
  }

  showConfirmDialog(idOrdenVenta: Number, idEstatus: Number): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: `¿Esta seguro que desea ${idEstatus === 3 ? 'cancelar' : 'autorizar'} la orden ${idOrdenVenta}?`,
    })
      .afterClosed()
      .subscribe((confirmado: Boolean) => {
        if (confirmado) {
          const orderService = { idOrdenVenta, idEstatus };

          this.salesOrderService.updateStatus(orderService)
            .pipe()
            .subscribe({
              next: (response) => {
                this.dialog.open(SimpleDialogComponent, {
                  data: { type: 'success', message: `La orden ${idOrdenVenta} fue actualizada con éxito` },
                })
                  .afterClosed()
                  .subscribe(() => {
                    this.onSearch();
                  });
              },
              error: () => {
                this.dialog.open(SimpleDialogComponent, {
                  data: { type: 'error', message: `Ocurrio un error al actualizar la orden ${idOrdenVenta}` },
                });
                console.error('Error trying to update sales order');
              }
            });
        }
      });
  }

  get form() {
    return this.searchForm.controls;
  }
}
