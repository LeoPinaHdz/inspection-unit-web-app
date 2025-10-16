export interface Client {
    idCliente: number;
    nombre?: string;
    rfc?: string;
    calle?: string;
    exterior?: number;
    interior?: number;
    colonia?: string;
    cp?: string;
    municipio?: string;
    idEstado?: number;
    idPais?: number;
    telefono?: number;
    email?: string;
    idEstatus?: number;
    persona?: number;
    idPromotor?: number;
    idEjecutivo?: number;
    tipoMunicipio?: boolean;
    aplicaIva?: boolean;
}
