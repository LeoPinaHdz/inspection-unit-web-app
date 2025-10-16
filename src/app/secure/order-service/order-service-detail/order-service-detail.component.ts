import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { ClientService } from 'src/app/_shared/services/client.service';
import { Warehouse, WarehouseService } from 'src/app/_shared/services/warehouse.service';
import { Service, ServiceService } from 'src/app/_shared/services/service.service';
import { OrderService, OrderServiceDetail, OrderServiceService } from '../order-service.service';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmationDialogComponent } from 'src/app/_shared/components/confirmation-dialog/confirmation-dialog.component';
import { UnitService } from 'src/app/_shared/services/unit.service';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { Client } from 'src/app/_shared/models/client.model';
import { Unit } from 'src/app/_shared/models/unit.model';

@Component({
  selector: 'order-service-detail',
  templateUrl: './order-service-detail.component.html',
})
export class OrderServiceDetailComponent implements OnInit {
  formOrderService!: FormGroup;
  isEdit = false;
  orderServiceId: any;
  orderService: OrderService = { idOrdenServicio: 0, idEstatus: 1 };
  clients: Client[] = [];
  warehouses: Warehouse[] = [];
  services: Service[] = [];
  formOrderServiceDetail!: FormGroup;
  selectedDetail?: OrderServiceDetail;
  orderServiceDetails: OrderServiceDetail[] = [];
  displayedColumns: string[] = ['partida', 'servicio', 'cantidad', 'nombreUnidad', 'referencia', 'actions'];
  dataSource: MatTableDataSource<OrderServiceDetail> = new MatTableDataSource();
  units: Unit[] = [];
  filteredUnits: ReplaySubject<Unit[]> = new ReplaySubject<Unit[]>(1);
  _onDestroy = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderServiceService: OrderServiceService,
    private clientService: ClientService,
    private warehouseService: WarehouseService,
    private serviceService: ServiceService,
    private unitService: UnitService,
    private dialog: MatDialog
  ) { }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  ngOnInit() {
    this.orderServiceId = this.route.snapshot.paramMap.get('id');

    this.formOrderService = new FormGroup({
      idOrdenServicio: new FormControl({ value: '', disabled: true }, [Validators.required]),
      idCliente: new FormControl({ value: '', disabled: this.orderServiceId }, [Validators.required]),
      idBodega: new FormControl({ value: '', disabled: this.orderServiceId }, [Validators.required]),
      fServicio: new FormControl(new Date(), [Validators.required]),
      observaciones: new FormControl('', []),
    });


    this.formOrderServiceDetail = new FormGroup({
      idOrdenServicioDetalle: new FormControl(0, []),
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
          this.formOrderServiceDetail.get('idUnidad')!.setValue(this.units[0]);
          this.formOrderServiceDetail.get('idUnidadFilter')!.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
              this.filterUnits();
            });
        },
        error: () => {
          console.error('Error trying to get clients');
        }
      });

    if (!this.orderServiceId) {
      this.clientService.getAllActive()
        .pipe()
        .subscribe({
          next: (response) => {
            this.clients = response;
            if (this.clients.length) {
              this.formOrderService.get('idCliente')!.setValue(this.clients[0].idCliente);
              if (this.clients.length === 1) this.formOrderService.get('idCliente')!.disable();
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
              this.formOrderService.get('idBodega')!.setValue(this.warehouses[0].idBodega);
              if (this.warehouses.length === 1) this.formOrderService.get('idBodega')!.disable();
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

    if (this.orderServiceId) {
      this.isEdit = true;

      this.orderServiceService.getById(this.orderServiceId)
        .pipe()
        .subscribe({
          next: (response) => {
            this.updateOrderServiceForm(response);
            if (response.idEstatus !== 1) {
              this.formOrderService.get('fServicio')!.disable();
              this.formOrderService.get('observaciones')!.disable();
            }
            this.clients = [{ idCliente: response.idCliente || 0, nombre: response.cliente }];
            this.formOrderService.get('idCliente')!.setValue(response.idCliente);
            this.warehouses = [{ idBodega: response.idBodega || 0, nombre: response.bodega }];
            this.formOrderService.get('idBodega')!.setValue(response.idBodega);
            if (response.detalle) this.orderServiceDetails = response.detalle;
            this.initDetailsTable(this.orderServiceDetails);
          },
          error: () => {
            this.dialog.open(SimpleDialogComponent, {
              data: { type: 'error', message: `Error al obtener los datos del servicio ${this.orderServiceId}` },
            })
              .afterClosed()
              .subscribe(() => {
                this.router.navigate([`/secure/order-services`]);
              });
            console.error('Error trying to get orderService detail');
          }
        });
    }
  }

  updateOrderServiceForm(orderService: OrderService): void {
    this.formOrderService.patchValue({
      idOrdenServicio: orderService.idOrdenServicio,
      fServicio: orderService.fServicio,
      idCliente: orderService.idCliente,
      idBodega: orderService.idBodega,
      observaciones: orderService.observaciones,
    });
    this.orderService = orderService;
  }


  resetDetatilForm() {
    this.formOrderServiceDetail.reset();
    this.formOrderServiceDetail.get('idOrdenServicioDetalle')!.setValue(0);
    this.formOrderServiceDetail.get('partida')!.setValue(0);
  }

  editDetail(detail: OrderServiceDetail): void {
    this.selectedDetail = detail;
    this.orderServiceDetails = this.orderServiceDetails.filter(d => d.partida !== detail.partida);
    this.initDetailsTable(this.orderServiceDetails);
    this.formOrderServiceDetail.patchValue({
      idOrdenServicioDetalle: detail.idOrdenServicioDetalle,
      idServicio: detail.idServicio,
      cantidad: detail.cantidad,
      partida: detail.partida,
      idUnidad: detail.idUnidad,
      referencia: detail.referencia,
    });
  }

  showConfirmDeleteDialog(detail: OrderServiceDetail): void {
    this.dialog.open(ConfirmationDialogComponent, {
      data: `¿Esta seguro que desea eliminar la partida ${detail.partida}?`,
    })
      .afterClosed()
      .subscribe((confirmado: Boolean) => {
        if (confirmado) {
          this.orderServiceDetails = this.orderServiceDetails.filter(d => d.partida !== detail.partida);
          this.initDetailsTable(this.orderServiceDetails, true);
        }
      });
  }

  onCancelEdit(): void {
    if (this.selectedDetail) {
      this.orderServiceDetails.push(this.selectedDetail);
      this.initDetailsTable(this.orderServiceDetails);
      this.resetDetatilForm();
      this.selectedDetail = undefined;
    }
  }

  onSubmitDetail(): void {
    this.formOrderServiceDetail.markAllAsTouched();
    if (!this.formOrderServiceDetail.valid) return;
    const orderServiceDetail = this.formOrderServiceDetail.getRawValue();

    orderServiceDetail.nombreUnidad = this.units.filter(u => u.idUnidad === orderServiceDetail.idUnidad)[0].nombre;
    orderServiceDetail.nombreServicio = this.services.filter(u => u.idServicio === orderServiceDetail.idServicio)[0].nombre;
    orderServiceDetail.descuento = 0;

    if (this.isEdit && this.selectedDetail) {
      this.selectedDetail.idServicio = orderServiceDetail.idServicio;
      this.selectedDetail.idUnidad = orderServiceDetail.idUnidad;
      this.selectedDetail.cantidad = orderServiceDetail.cantidad;
      this.selectedDetail.referencia = orderServiceDetail.referencia;
      this.selectedDetail.nombreServicio = orderServiceDetail.nombreServicio;
      this.selectedDetail.nombreUnidad = orderServiceDetail.nombreUnidad;

      this.orderServiceDetails.push(this.selectedDetail);
    } else {
      orderServiceDetail.partida = orderServiceDetail.partida == 0 ? this.orderServiceDetails.length + 1 : orderServiceDetail.partida;
      this.orderServiceDetails.push(orderServiceDetail);
    }

    this.selectedDetail = undefined;
    this.initDetailsTable(this.orderServiceDetails, true);
    this.resetDetatilForm();
  }

  initDetailsTable(orderServices: OrderServiceDetail[], setPartida?: boolean) {
    const sortedSalesOrders = orderServices.sort((a, b) => a.partida > b.partida ? 1 : -1);
    if (setPartida) {
      sortedSalesOrders.forEach((item, i) => {
        item.partida = i + 1;
      });
    }

    this.dataSource = new MatTableDataSource(sortedSalesOrders);
  }

  onSubmit(): void {
    this.formOrderService.markAllAsTouched();
    if (!this.formOrderService.valid || this.orderServiceDetails.length === 0) return;

    const orderService: OrderService = { ...this.orderService, ...this.formOrderService.getRawValue() };

    orderService.detalle = this.orderServiceDetails;

    this.orderServiceService.save(orderService)
      .pipe()
      .subscribe({
        next: (response: any) => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'success', message: `El servicio ${orderService.idOrdenServicio} fue guardado con éxito` },
          })
            .afterClosed()
            .subscribe((confirmado: Boolean) => {
              this.router.navigate([`/secure/order-services`]);
            });
        },
        error: () => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'error', message: `Error al guardar el servicio ${orderService.idOrdenServicio}` },
          });
          console.error('Error trying to save orderService');
        }
      });
  }

  private filterUnits() {
    if (!this.units) {
      return;
    }
    let search = this.formOrderServiceDetail.get('idUnidadFilter')!.value;
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

  get formDetail() {
    return this.formOrderServiceDetail.controls;
  }

  get form() {
    return this.formOrderService.controls;
  }
}
