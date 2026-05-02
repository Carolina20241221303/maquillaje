// ── Autenticación ──
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  nombre: string
  apellido: string
  email: string
  password: string
  telefono?: string
  documento_identidad?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserResponse {
  id_usuario: number
  nombre: string
  apellido: string
  email: string
  rol: string
  activo: boolean
}

export type Role = 'admin' | 'inventario' | 'cliente'

// ── Geografía ──
export interface Departamento {
  id_departamento: number
  nombre_departamento: string
}

export interface Ciudad {
  id_ciudad: number
  nombre_ciudad: string
  id_departamento: number
}

// ── Catálogo ──
export interface Categoria {
  id_categoria: number
  nombre_categoria: string
}

export interface Marca {
  id_marca: number
  nombre_marca: string
}

export interface UnidadMedida {
  id_unidad: number
  nombre_unidad: string
  abreviatura: string
}

export interface Producto {
  id_producto: number
  nombre_producto: string
  descripcion?: string
  tono?: string | null
  variante_tipo?: string | null
  variante_valor?: string | null
  variante_color_hex?: string | null
  id_categoria: number
  id_marca: number
  id_unidad?: number
  nombre_categoria?: string
  nombre_marca?: string
  precio_venta?: number
  precio_con_iva?: number
  porcentaje_iva?: number
  stock_actual?: number
  imagen_url?: string | null
  variantes?: ProductoVariante[]
}

export interface ProductoVariante {
  id_variante?: number | null
  id_producto: number
  nombre_variante: string
  color_hex?: string | null
  orden?: number
  activo?: boolean
}

export interface ProductoCarrito {
  id_producto: number
  nombre_producto: string
  precio_unitario: number
  cantidad: number
  stock_disponible: number
  id_variante?: number | null
  nombre_variante?: string | null
  color_hex_variante?: string | null
  tipo_variante?: string | null
}

export interface PrecioProducto {
  id_precio: number
  id_producto: number
  precio_unitario: number
  vigente_desde: string
  vigente_hasta?: string
}

// ── Proveedor ──
export interface Proveedor {
  id_proveedor: number
  nombre_proveedor: string
  contacto?: string
  telefono?: string
  email?: string
}

export interface ProductoProveedor {
  id_relacion: number
  id_producto: number
  id_proveedor: number
  codigo_proveedor?: string
}

// ── Inventario ──
export interface Lote {
  id_lote: number
  fecha_ingreso: string
  id_proveedor: number
  cantidad?: number
}

export interface Inventario {
  id_inventario: number
  id_producto: number
  id_lote: number
  cantidad: number
}

export interface TipoMovimiento {
  id_tipo_movimiento: number
  nombre_tipo_movimiento: string
}

export interface MovimientoInventario {
  id_movimiento: number
  id_inventario: number
  id_tipo_movimiento: number
  cantidad: number
  fecha_movimiento: string
  descripcion?: string
}

// ── Dirección ──
export interface DireccionEnvio {
  id_direccion: number
  id_usuario: number
  nombre_destinatario: string
  telefono: string | null
  direccion: string
  id_ciudad: number
  codigo_postal: string | null
  es_principal: boolean
  activa: boolean
  ciudad?: string | null
  departamento?: string | null
}

// ── Orden ──
export interface DireccionEnvioOrden {
  nombre_destinatario: string
  telefono: string | null
  direccion: string
  ciudad: string | null
  departamento: string | null
  codigo_postal: string | null
}

export interface Orden {
  id_orden: number
  id_usuario: number
  email_usuario?: string | null
  id_direccion: number
  fecha_orden: string
  fecha_actualizacion: string
  estado: string
  subtotal: number
  descuento: number
  iva_total: number
  total: number
  notas: string | null
  detalles: DetalleOrden[]
  direccion_envio: DireccionEnvioOrden | null
}

export interface DetalleOrden {
  id_detalle?: number | null
  id_orden: number
  id_producto: number
  id_variante?: number | null
  tipo_variante?: string | null
  nombre_variante?: string | null
  color_hex_variante?: string | null
  id_lote: number | null
  cantidad: number
  precio_unitario: number
  porcentaje_iva: number
  subtotal_linea: number
  nombre_producto?: string
  nombre_categoria?: string
}

// ── Pago ──
export interface Pago {
  id_pago: number
  id_orden: number
  fecha_pago: string
  monto: number
  metodo_pago: string
  estado_pago: string
}
