export interface List {
    idLista: number;
    idSolicitud?: number;
    idCliente?: number;
    tipoServicio?: number;
    dictaminacion?: string;
    idNorma?: number;
    claveSolicitud?: string;
    idEjecutivo?: number;
    idEjecutivo2?: number;
    fInspeccion?: string;
    fPresentacion?: string;
    tecnica?: string;
    muestra?: string;
    instrumento?: string;
    lote?: string;
    observaciones?: string;
    puntos?: string;
    contenido?: string;
    resumen?: string;
    idEstatus?: number;
    idUsuario?: number;
    fCaptura?: string;
    fModificacion?: string;
    idPresentacion?: number;
    listasDetalle?: ListDetail[];
    listasPunto?: ListPoint[];
    producto?: string;
    marca?: string;
    modelo?: string;
    pais?: string;
    base?: string;
    altura?: string;
    diametro?: string;
    spe?: string;
    etiquetas?: number;
    idServicio?: number;
}

export interface ListDetail {
    idListaDetalle: Number;
    idFolioDetalle?: Number;
    idSolicitudDetalle?: Number;
    cantidad?: Number;
    idEstatus?: string;
}

export interface ListPoint {
    idListaPunto: number;
    idPunto?: number;
    dictaminacion?: string;
    observaciones?: string;
}
