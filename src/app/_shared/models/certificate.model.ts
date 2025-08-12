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
    idEstatus?: number;
    idEjecutivo?: number;
}