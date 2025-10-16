import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-pdf-modal',
  templateUrl: './pdf-modal.component.html',
  styleUrls: ['./pdf-modal.component.scss']
})
export class PdfModalComponent {
  constructor(
    public dialogRef: MatDialogRef<PdfModalComponent>,
    @Inject(MAT_DIALOG_DATA) public pdfUrl: string
  ) {}

  closeModal() {
    this.dialogRef.close();
  }
}