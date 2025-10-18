export interface Standard {
    idNorma: Number;
    nombre: string;
    descripcion: string;
    puntos?: string;
    exceptos?: Number;
    fCaptura?: string;
    fModificacion?: string;
    idUsuario: Number;
    idEstatus: Number;
    normaPuntos?: StandardSpec[];
}

export interface StandardSpec {
    idNormaPunto: number,
    idNorma?: number,
    punto: number,
    contenido?: string,
    idServicio?: number
}