export interface Certificate {
    idActa: number;
    folio?: number;
    idCliente?: number;
    idOficio?: number;
    idSolicitud?: number;
    fIniActa?: string;
    hIniActa?: string;
    fFinActa?: string;
    hFinActa?: string;
    otroServicio?: boolean;
    cual?: string;
    tipoLote?: string;
    cantidad?: number;
    instrumento?: string;
    estadoInstrumento?: string;
    observaciones?: string;
    factura?: string;
    lote?: string;
    muestra?: string;
    manifiesto?: string;
    resultado?: string;
    idEstatus?: number;
    idEjecutivo?: number;
}