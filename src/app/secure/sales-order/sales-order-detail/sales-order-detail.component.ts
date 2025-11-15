import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from 'src/app/_shared/components/confirmation-dialog/confirmation-dialog.component';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { ClientService } from 'src/app/_shared/services/client.service';
import { Warehouse, WarehouseService } from 'src/app/_shared/services/warehouse.service';
import { Service, ServiceService } from 'src/app/_shared/services/service.service';
import { SalesOrder, SalesOrderDetail, SalesOrderService } from '../sales-order.service';
import { Fee, FeeService } from 'src/app/_shared/services/fee.service';
import { lastValueFrom, ReplaySubject, Subject, takeUntil } from 'rxjs';
import { UnitService } from 'src/app/_shared/services/unit.service';
import { PdfModalComponent } from 'src/app/_shared/components/pdf-modal/pdf-modal.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Client } from 'src/app/_shared/models/client.model';
import { Unit } from 'src/app/_shared/models/unit.model';

@Component({
  selector: 'sales-order-detail',
  templateUrl: './sales-order-detail.component.html',
})
export class SalesOrderDetailComponent implements OnInit, OnDestroy {
  formSalesOrder!: FormGroup;
  formSalesOrderDetail!: FormGroup;
  isEdit = false;
  salesOrderId: any;
  salesOrder: SalesOrder = { idOrdenVenta: 0, idEstatus: 1 };
  selectedDetail?: SalesOrderDetail;
  salesOrderDetails: SalesOrderDetail[] = [];
  clients: Client[] = [];
  warehouses: Warehouse[] = [];
  displayedColumns: string[] = ['partida', 'servicio', 'cantidad', 'nombreUnidad', 'referencia', 'cuota', 'subTotal', 'iva', 'total', 'actions'];
  dataSource: MatTableDataSource<SalesOrderDetail> = new MatTableDataSource();
  services: Service[] = [];
  units: Unit[] = [];
  filteredUnits: ReplaySubject<Unit[]> = new ReplaySubject<Unit[]>(1);
  _onDestroy = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private salesOrderService: SalesOrderService,
    private clientService: ClientService,
    private warehouseService: WarehouseService,
    private dialog: MatDialog,
    private serviceService: ServiceService,
    private unitService: UnitService,
    private sanitizer: DomSanitizer,
    private feeService: FeeService
  ) { }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  ngOnInit() {
    this.salesOrderId = this.route.snapshot.paramMap.get('id');

    this.formSalesOrder = new FormGroup({
      idOrdenVenta: new FormControl({ value: '', disabled: true }, [Validators.required]),
      idCliente: new FormControl({ value: '', disabled: this.salesOrderId }, [Validators.required]),
      idBodega: new FormControl({ value: '', disabled: this.salesOrderId }),
      fFactura: new FormControl(new Date(), [Validators.required]),
      referencia: new FormControl('', []),
    });

    this.formSalesOrderDetail = new FormGroup({
      idOrdenVentaDetalle: new FormControl(0, []),
      cantidad: new FormControl('', [Validators.required]),
      partida: new FormControl('', []),
      idUnidad: new FormControl('', [Validators.required]),
      idUnidadFilter: new FormControl('', []),
      idServicio: new FormControl('', [Validators.required]),
      referencia: new FormControl('', [Validators.required]),
    });

    this.unitService.getAll()
      .pipe()
      .subscribe({
        next: (response) => {
          this.units = response;
          this.filteredUnits.next(this.units.slice());
          this.formSalesOrderDetail.get('idUnidad')!.setValue(this.units[0]);
          this.formSalesOrderDetail.get('idUnidadFilter')!.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
              this.filterUnits();
            });
        },
        error: () => {
          console.error('Error trying to get clients');
        }
      });

    if (!this.salesOrderId) {
      this.clientService.getAllActive()
        .pipe()
        .subscribe({
          next: (response) => {
            this.clients = response;
            if (this.clients.length) {
              this.formSalesOrder.get('idCliente')!.setValue(this.clients[0].idCliente);
              if (this.clients.length === 1) this.formSalesOrder.get('idCliente')!.disable();
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
              this.formSalesOrder.get('idBodega')!.setValue(this.warehouses[0].idBodega);
              if (this.warehouses.length === 1) this.formSalesOrder.get('idBodega')!.disable();
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


    if (this.salesOrderId) {
      this.isEdit = true;

      this.salesOrderService.getDetail(this.salesOrderId)
        .pipe()
        .subscribe({
          next: (response) => {
            this.updateSalesOrderForm(response);
            if (response.idEstatus !== 1) {
              this.formSalesOrder.get('fFactura')!.disable();
              this.formSalesOrder.get('referencia')!.disable();
            }
            if (response.detalle) this.salesOrderDetails = response.detalle;
            this.initDetailsTable(this.salesOrderDetails);
            this.clients = [{ idCliente: response.idCliente || 0, nombre: response.cliente }];
            this.formSalesOrder.get('idCliente')!.setValue(response.idCliente);
            this.warehouses = [{ idBodega: response.idBodega || 0, nombre: response.bodega }];
            this.formSalesOrder.get('idBodega')!.setValue(response.idBodega);
          },
          error: () => {
            this.dialog.open(SimpleDialogComponent, {
              data: { type: 'error', message: `Error al obtener los datos de la orden ${this.salesOrderId}` },
            })
              .afterClosed()
              .subscribe(() => {
                this.router.navigate([`/secure/sales-orders`]);
              });
            console.error('Error trying to get salesOrder detail');
          }
        });
    }
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

  updateSalesOrderForm(salesOrder: SalesOrder): void {
    this.formSalesOrder.patchValue({
      idOrdenVenta: salesOrder.idOrdenVenta,
      referencia: salesOrder.referencia,
      idCliente: salesOrder.idCliente,
      idBodega: salesOrder.idBodega,
      fFactura: salesOrder.fFactura,
    });
    this.salesOrder = salesOrder;
  }

  resetDetatilForm() {
    this.formSalesOrderDetail.reset();
    this.formSalesOrderDetail.get('idOrdenVentaDetalle')!.setValue(0);
    this.formSalesOrderDetail.get('partida')!.setValue(0);
  }

  editDetail(detail: SalesOrderDetail): void {
    this.selectedDetail = detail;
    this.salesOrderDetails = this.salesOrderDetails.filter(d => d.partida !== detail.partida);
    this.initDetailsTable(this.salesOrderDetails);
    this.formSalesOrderDetail.patchValue({
      idOrdenVentaDetalle: detail.idOrdenVentaDetalle,
      idServicio: detail.idServicio,
      cantidad: detail.cantidad,
      idUnidad: detail.idUnidad,
      partida: detail.partida,
      referencia: detail.referencia,
    });
  }

  showConfirmDeleteDialog(detail: SalesOrderDetail): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: `¿Esta seguro que desea eliminar la partida ${detail.partida}?`,
    })
      .afterClosed()
      .subscribe((confirmado: Boolean) => {
        if (confirmado) {
          this.salesOrderDetails = this.salesOrderDetails.filter(d => d.partida !== detail.partida);
          this.initDetailsTable(this.salesOrderDetails, true);
        }
      });
  }

  onCancelEdit(): void {
    if (this.selectedDetail) {
      this.salesOrderDetails.push(this.selectedDetail);
      this.initDetailsTable(this.salesOrderDetails);
      this.resetDetatilForm();
      this.selectedDetail = undefined;
    }
  }

  async onSubmitDetail() {
    this.formSalesOrderDetail.markAllAsTouched();
    if (!this.formSalesOrderDetail.valid) return;
    const salesOrderDetail = this.formSalesOrderDetail.getRawValue();
    const salesOrderForm = this.formSalesOrder.getRawValue();
    let fees: Fee[] = [];

    try {
      fees = await lastValueFrom(this.feeService.getCurrent(salesOrderDetail.idServicio, salesOrderForm.idCliente, salesOrderForm.idBodega));
    } catch (error) {
      console.error('Error trying to get fees', error);
    }

    if (!fees.length) {
      this.dialog.open(SimpleDialogComponent, {
        data: { type: 'error', message: `No se puede agregar el servicio porque no existen cuotas relacionadas` },
      });

      return;
    }

    salesOrderDetail.cuota = fees[0].cuota;
    salesOrderDetail.subTotal = (fees[0].cuota || 0) * salesOrderDetail.cantidad;
    salesOrderDetail.iva = fees[0].aplicaIva ? Number((salesOrderDetail.subTotal * (fees[0].iva || 0)).toFixed(2)) : 0;
    salesOrderDetail.total = salesOrderDetail.subTotal + salesOrderDetail.iva;
    salesOrderDetail.nombreServicio = this.services.filter(u => u.idServicio === salesOrderDetail.idServicio)[0].nombre;
    salesOrderDetail.nombreUnidad = this.units.filter(u => u.idUnidad === salesOrderDetail.idUnidad)[0].nombre;
    salesOrderDetail.descuento = 0;

    if (this.isEdit && this.selectedDetail) {
      this.selectedDetail.idServicio = salesOrderDetail.idServicio;
      this.selectedDetail.idUnidad = salesOrderDetail.idUnidad;
      this.selectedDetail.cantidad = salesOrderDetail.cantidad;
      this.selectedDetail.referencia = salesOrderDetail.referencia;
      this.selectedDetail.cuota = salesOrderDetail.cuota;
      this.selectedDetail.subTotal = salesOrderDetail.subTotal;
      this.selectedDetail.iva = salesOrderDetail.iva;
      this.selectedDetail.total = salesOrderDetail.total;
      this.selectedDetail.nombreServicio = salesOrderDetail.nombreServicio;
      this.selectedDetail.nombreUnidad = salesOrderDetail.nombreUnidad;

      this.salesOrderDetails.push(this.selectedDetail);
    } else {
      salesOrderDetail.partida = salesOrderDetail.partida == 0 ? this.salesOrderDetails.length + 1 : salesOrderDetail.partida;
      this.salesOrderDetails.push(salesOrderDetail);
    }

    this.selectedDetail = undefined;
    this.initDetailsTable(this.salesOrderDetails, true);
    this.resetDetatilForm();
  }

  onSubmit(): void {
    this.formSalesOrder.markAllAsTouched();
    if (!this.formSalesOrder.valid || this.salesOrderDetails.length === 0) return;


    const salesOrder: SalesOrder = { ...this.salesOrder, ...this.formSalesOrder.getRawValue()};

    delete salesOrder['idBodega'];
    
    if (!this.isEdit) {
      const selectedClient = this.clients.filter(c => c.idCliente === salesOrder.idCliente)[0];

      salesOrder.grupoCargo = 'FCT';
      salesOrder.observaciones = '';
      salesOrder.folio = '';
      salesOrder.idEstatus = 1;
      salesOrder.serie = selectedClient.aplicaIva ? 'F' : 'O';
    }
    salesOrder.idIntermediario = salesOrder.idCliente;
    salesOrder.subTotal = this.getSubtotal();
    salesOrder.total = this.getTotal();
    salesOrder.iva = this.getTotalIva();

    salesOrder.detalle = this.salesOrderDetails;

    this.salesOrderService.save(salesOrder)
      .pipe()
      .subscribe({
        next: (response: any) => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'success', message: `La orden ${salesOrder.idOrdenVenta} fue guardada con éxito` },
          })
            .afterClosed()
            .subscribe((confirmado: Boolean) => {
              this.router.navigate([`/secure/sales-orders`]);
            });
        },
        error: () => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'error', message: `Error al guardar la orden ${salesOrder.idOrdenVenta}` },
          });
          console.error('Error trying to save salesOrder detail');
        }
      });
  }

  initDetailsTable(salesOrders: SalesOrderDetail[], setPartida?: boolean) {
    const sortedSalesOrders = salesOrders.sort((a, b) => a.partida > b.partida ? 1 : -1);
    if (setPartida) {
      sortedSalesOrders.forEach((item, i) => {
        item.partida = i + 1;
      });
    }

    this.dataSource = new MatTableDataSource(sortedSalesOrders);
  }

  getTotal(): Number {
    return this.salesOrderDetails.map(d => Number(d.total) || 0).reduce((acc, value) => acc + value, 0);
  }

  getTotalIva(): Number {
    return this.salesOrderDetails.map(d => Number(d.iva) || 0).reduce((acc, value) => acc + value, 0);
  }

  getSubtotal(): Number {
    return this.salesOrderDetails.map(d => Number(d.subTotal) || 0).reduce((acc, value) => acc + value, 0);
  }

  private filterUnits() {
    if (!this.units) {
      return;
    }
    let search = this.formSalesOrderDetail.get('idUnidadFilter')!.value;
    if (!search) {
      this.filteredUnits.next(this.units.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    this.filteredUnits.next(
      this.units.filter(unit => unit.nombre && unit.nombre.toLowerCase().indexOf(search) > -1)
    );
  }

  get form() {
    return this.formSalesOrder.controls;
  }

  get formDetail() {
    return this.formSalesOrderDetail.controls;
  }
}
