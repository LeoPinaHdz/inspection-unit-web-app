import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from 'src/app/_shared/components/simple-dialog/simple-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { Reference } from 'src/app/_shared/models/reference.model';
import { ReferenceService } from 'src/app/_shared/services/reference.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { ConfirmationDialogComponent } from 'src/app/_shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'reference-validation',
  templateUrl: './reference-validation.component.html',
})
export class ReferenceValidationComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['select', 'folio'];
  references: Reference[] = [];
  searchForm!: FormGroup;
  currentStatus: any = 1;
  dataSource: MatTableDataSource<Reference> = new MatTableDataSource();
  selection = new SelectionModel<Reference>(true, []);
  _onDestroy = new Subject<void>();

  constructor(
    private router: Router,
    private referenceService: ReferenceService,
    private dialog: MatDialog
  ) { }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  ngOnInit() {
    this.references = [];

    this.searchForm = new FormGroup({
      tipo: new FormControl('1', [Validators.required]),
      idEstatus: new FormControl('1', [Validators.required]),
      folio: new FormControl('', [])
    });

    this.searchForm.get('idEstatus')!.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.setStatus();
      });
  }

  showConfirmDialog(newStatus: number): void {
    let status = '';

    switch(newStatus) {
      case 3: status = 'cancelar';
      break;
      case 1: status = 'activar';
      break;
      default: status = 'validar';
    }
    
    this.dialog.open(ConfirmationDialogComponent, {
      data: `¿Esta seguro que desea ${status} los folios seleccionados?`,
    })
      .afterClosed()
      .subscribe((confirmado: Boolean) => {
        if (confirmado) {
          this.updateReferences(newStatus);
        }
      });
  }

  updateReferences(newStatus: number) {
    const request = this.searchForm.getRawValue();
    let details: any[] = [];

    if (request.tipo == 1) {
      this.selection.selected.forEach(r => r.idEstatus = newStatus);
      details = this.selection.selected;
    } else {
      details = this.selection.selected.map(r => {
        return { idFolioDetalle: r.idFolio, idEstatus: newStatus };
      });
    }

    this.referenceService.updateStatus(request.tipo, details)
      .pipe()
      .subscribe({
        next: (response) => {
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'success', message: 'Los folios fueron actualizados con éxito' },
          });

          this.clear();
        },
        error: (err) => {
          const errMessage = 'Ocurrio un error al actualizar los folios';
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'error', message: errMessage },
          });
          console.log('Error trying to get references');
        }
      });
  }

  onSearch() {
    const request = this.searchForm.getRawValue();
    request.folio = request.folio === '' ? 0 : request.folio;

    this.referenceService.getValidation(request)
      .pipe()
      .subscribe({
        next: (response) => {
          if (response.length > 0) {
            this.references = response;
            this.dataSource = new MatTableDataSource(this.references);
          } else {
            const errMessage = 'No existen folios que coincidan con el criterio de busqueda';
            this.dialog.open(SimpleDialogComponent, {
              data: { type: 'warn', message: errMessage },
            });
          }
        },
        error: (err) => {
          const errMessage = 'Ocurrio un error al obtener los folios';
          this.dialog.open(SimpleDialogComponent, {
            data: { type: 'error', message: errMessage },
          });
          console.log('Error trying to get references');
        }
      });
  }

  setStatus() {
    const request = this.searchForm.getRawValue();
    this.currentStatus = request.idEstatus;

    this.clear();
  }

  clear() {
    this.references = [];
    this.dataSource = new MatTableDataSource(this.references);
    this.selection.clear();
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

  checkboxLabel(row?: Reference): string {
    if (!row) {
      return `${this.isAllSelected() ? 'Deselecciona' : 'Selecciona'} todos`;
    }
    return `${this.selection.isSelected(row) ? 'Deselecciona' : 'Selecciona'} row ${row.folio}`;
  }
}