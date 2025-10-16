import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CurrencyPipe } from '@angular/common';

(jsPDF as any).prototype.autoTable = autoTable;

@Injectable()
export class SalesOrderService {
  constructor(private http: HttpClient,
    private currencyPipe: CurrencyPipe
  ) { }

  search(request: PendingSales): Observable<SalesOrder[]> {
    return this.http.post<SalesOrder[]>(`${environment.url}SalesOrder/Search`, request);
  }

  getDetail(id: Number): Observable<SalesOrder> {
    return this.http.get<any>(`${environment.url}SalesOrder/Get?id=${id}`);
  }

  updateStatus(request: SalesOrder): Observable<any> {
    return this.http.put<any>(`${environment.url}SalesOrder/UpdateStatus`, request);
  }

  save(receipt: SalesOrder): Observable<any> {
    if (!receipt.idOrdenVenta || receipt.idOrdenVenta === 0)
      return this.http.post<any>(`${environment.url}SalesOrder/Create`, receipt);
    return this.http.put<any>(`${environment.url}SalesOrder/Update`, receipt);
  }

  getReporte(id: Number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.url}SalesOrder/Reporte?orden=${id}`);
  }

  generatePdf(data: any[]): Blob {
    const header = data[0];

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightAlignX = pageWidth - 70;
    const rightAlignXText = pageWidth - 16;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(header.Unidad, pageWidth / 2, 10, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(header.RFCUnidad, pageWidth / 2, 15, { align: 'center' });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ORDEN DE VENTA', 10, 15);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);

    doc.text('Domicilio y Expedido en:', 10, 20);
    doc.text('Lugar de expedición:', 10, 28);
    doc.text('Datos del receptor', 10, 37);
    doc.text('Cliente:', 10, 42);
    doc.text('RFC:', 10, 46);
    doc.text('Residencia fiscal:', 10, 54);
    doc.text('Domicilio:', 10, 58);
    doc.text('Pre-Factura:', pageWidth - 49, 54);
    doc.text('De Fecha:', pageWidth - 46, 58);

    doc.setFont('Helvetica', 'normal');
    doc.text(header.DomicilioExpedicion, 10, 24);
    doc.text(header.LugarExpedicion, 39, 28);
    doc.text(header.Cliente, 21, 42);
    doc.text(header.RFCCliente, 18, 46);
    doc.text(header.ResidenciaCliente, 25, 58);
    doc.text(header.Folio, rightAlignXText, 54, { align: 'right' });
    doc.text(header.FechaFactura, rightAlignXText, 58, { align: 'right' });

    const imgUrl = 'assets/logo.jpeg'; // Ruta del logo
    doc.addImage(imgUrl, 'JPEG', pageWidth - 36, 15, 21.8, 23.9); // Tamaño en mm

    const tableY = 70;
    const tableHeaders = [
      'Partida', 'Cantidad', 'Descripción', 'Precio Unitario', 'Subtotal', ''
    ];
    const tableData: any[][] = [];

    data.forEach(d => {
      tableData.push([d.Partida, d.Cantidad, d.Descripcion, '', `${this.currencyPipe.transform(d.SubTotalPartida)}`, `${this.currencyPipe.transform(d.TotalPartida)}`]);
    });

    autoTable(doc, {
      startY: tableY,
      head: [tableHeaders],
      body: tableData,
      theme: 'plain',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [241, 142, 25], textColor: 0, fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'center' },
        2: { halign: 'left', cellWidth: 90 },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      },
      horizontalPageBreak: true,
      didDrawCell: (data) => {
        const { row, doc, cell } = data;
        const y = cell.y;
        const x = cell.x;
        const w = cell.width;
        const h = cell.height;
        if (data.section === 'body') {
          doc.line(x, y, x + w, y);
          doc.line(x, y + h, x + w, y + h);
        }
      }
    });

    const finalY = (doc as any).autoTable.previous.finalY + 5;

    doc.setFontSize(7);
    doc.setFont('Helvetica', 'bold');
    doc.text('Subtotal:', rightAlignX, finalY);
    doc.text('Descuento:', rightAlignX, finalY + 5);
    doc.text('IVA (16%):', rightAlignX, finalY + 10);
    doc.text('Total:', rightAlignX, finalY + 20);

    doc.setFont('Helvetica', 'normal');
    doc.text(`${this.currencyPipe.transform(header.SubTotal)}`, rightAlignXText, finalY, { align: 'right' });
    doc.text(`${this.currencyPipe.transform(header.Descuento)}`, rightAlignXText, finalY + 5, { align: 'right' });
    doc.text(`${this.currencyPipe.transform(header.IVA)}`, rightAlignXText, finalY + 10, { align: 'right' });
    doc.text(`${this.currencyPipe.transform(header.Total)}`, rightAlignXText, finalY + 20, { align: 'right' });

    doc.line(rightAlignX, finalY + 16, rightAlignXText, finalY + 16);
    doc.line(rightAlignX, finalY + 22, rightAlignXText, finalY + 22);

    //  Descargar PDF - doc.save('Factura.pdf');
    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }
}

export interface PendingSales {
  idBodega: Number;
  idCliente?: string;
  fechaDel?: string;
  fechaAl?: string;
  idServicio?: string;
  cancelados?: boolean;
}

export interface SalesOrderDetail {
  idOrdenVentaDetalle: Number;
  idOrdenVenta?: Number;
  idServicio?: Number;
  partida: Number;
  idUnidad?: Number;
  cantidad?: number;
  referencia?: string;
  cuota?: Number;
  subTotal?: Number;
  descuento?: Number;
  iva?: Number;
  total?: Number;
  fCaptura?: string;
  fModificacion?: string;
  idUsuario?: Number;
  idEstatus?: Number;
  nombreUnidad?: string;
  nombreServicio?: string;
}

export interface SalesOrder {
  idOrdenVenta: Number;
  idBodega?: number;
  idCliente?: number;
  idIntermediario?: Number;
  serie?: string;
  folio?: string;
  fFactura?: string;
  observaciones?: string;
  subTotal?: Number;
  descuento?: Number;
  iva?: Number;
  total?: Number;
  saldo?: Number;
  grupoCargo?: string;
  fCaptura?: Date;
  fModificacion?: Date;
  idUsuario?: Number;
  idEstatus?: Number;
  bodega?: string;
  cliente?: string;
  servicio?: string;
  fechaEmision?: string;
  cantidad?: number;
  unidad?: string;
  cuota?: string;
  referencia?: string;
  idOV?: number;
  detalle?: SalesOrderDetail[];
}


