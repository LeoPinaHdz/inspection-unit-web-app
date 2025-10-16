import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ErrorMessageComponent } from './components/error-message/mat-error-message.component';
import { ExcelService } from './services/excel.service';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { SimpleDialogComponent } from './components/simple-dialog/simple-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ClientService } from './services/client.service';
import { UploadButtonComponent } from './components/upload-button/upload-button.component';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from './services/auth.service';
import { AuthGuard } from './components/guards/auth.guard';
import { ScreenService } from './services/screen.service';
import { UsersService } from './services/user.service';
import { CountryService } from './services/country.service';
import { StandardService } from './services/standard.service';
import { ClientContactService } from './services/client-contact.service';
import { StateService } from './services/state.service';
import { PromoterService } from './services/promoter.service';
import { ClientRepresentativeService } from './services/client-representative.service';
import { ClientAddressService } from './services/client-address.service';
import { CatIdService } from './services/type-id.service';
import { ClientNotarialDataService } from './services/client-notarial-data.service';
import { ExecutiveService } from './services/executive.service';
import { ContactTypeService } from './services/contact-type.service';
import { ReportsService } from './services/reports.service';
import { OfficialService } from './services/official.service';
import { ContractService } from './services/contract.service';
import { UtilitiesService } from './services/utilities.service';
import { RequestService } from './services/request.service';
import { LetterService } from './services/letter.service';
import { ReferenceService } from './services/reference.service';
import { UnitService } from './services/unit.service';
import { ConversionService } from './services/conversion.service';
import { CertificateService } from './services/certificate.service';
import { RulingService } from './services/ruling.service';
import { TemplateService } from './services/template.service';
import { ProcessService } from './services/process.service';
import { ListService } from './services/list.service';
import { DisplayService } from './services/display.service';
import { LoadingService } from './services/loading.service';
import { StatusPipe } from './components/pipes/status.pipe';
import { DocumentService } from './services/documents.service';
import { PdfModalComponent } from './components/pdf-modal/pdf-modal.component';
import { WarehouseService } from './services/warehouse.service';
import { FeeService } from './services/fee.service';
import { ServiceService } from './services/service.service';
import { ParameterService } from './services/parameter.service';

@NgModule({
  declarations: [ErrorMessageComponent, ConfirmationDialogComponent, SimpleDialogComponent, UploadButtonComponent, StatusPipe, PdfModalComponent],
  imports: [FormsModule, CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  exports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    ErrorMessageComponent,
    ConfirmationDialogComponent,
    SimpleDialogComponent,
    UploadButtonComponent,
    StatusPipe,
    PdfModalComponent
  ],
  providers: [
    ExcelService,
    ClientService,
    AuthService,
    AuthGuard,
    ScreenService,
    UsersService,
    CountryService,
    StandardService,
    ClientContactService,
    StateService,
    PromoterService,
    ClientRepresentativeService,
    ClientAddressService,
    CatIdService,
    ClientNotarialDataService,
    ExecutiveService,
    OfficialService,
    ContactTypeService,
    ReportsService,
    ContractService,
    UtilitiesService,
    RequestService,
    LetterService,
    ReferenceService,
    UnitService,
    ConversionService,
    CertificateService,
    RulingService,
    TemplateService,
    ProcessService,
    DisplayService,
    ListService,
    LoadingService,
    DocumentService,
    WarehouseService,
    FeeService,
    ServiceService,
    ParameterService
  ],
})
export class SharedModule { }

