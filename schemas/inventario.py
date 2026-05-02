"""Schemas de Inventario: Lote, Inventario, Movimiento."""

from datetime import date, datetime

from pydantic import BaseModel, Field


# ── Lote ──
class LoteCreate(BaseModel):
    id_producto: int
    id_proveedor: int | None = None
    numero_lote: str | None = Field(None, max_length=80)
    fecha_vencimiento: date | None = None
    cantidad_inicial: int = Field(..., ge=0)


class LoteResponse(BaseModel):
    id_lote: int
    id_producto: int
    id_proveedor: int | None
    numero_lote: str | None
    fecha_vencimiento: date | None
    fecha_ingreso: date
    cantidad_inicial: int

    model_config = {"from_attributes": True}


# ── Inventario ──
class InventarioCreate(BaseModel):
    id_producto: int
    stock_actual: int = Field(default=0, ge=0)
    stock_minimo: int = Field(default=0, ge=0)
    stock_maximo: int | None = Field(None, ge=0)
    ubicacion_tienda: str | None = Field(None, max_length=80)


class InventarioUpdate(BaseModel):
    stock_minimo: int | None = Field(None, ge=0)
    stock_maximo: int | None = Field(None, ge=0)
    ubicacion_tienda: str | None = Field(None, max_length=80)


class InventarioResponse(BaseModel):
    id_producto: int
    stock_actual: int
    stock_minimo: int
    stock_maximo: int | None
    ubicacion_tienda: str | None
    ultima_actualizacion: datetime

    model_config = {"from_attributes": True}


# ── Tipo Movimiento ──
class TipoMovimientoResponse(BaseModel):
    id_tipo_movimiento: int
    nombre_tipo: str
    descripcion: str | None
    afecta_stock: bool

    model_config = {"from_attributes": True}


# ── Movimiento Inventario ──
class MovimientoCreate(BaseModel):
    id_lote: int
    id_tipo_movimiento: int
    id_orden: int | None = None
    cantidad: int = Field(..., gt=0)
    motivo: str | None = Field(None, max_length=200)


class MovimientoResponse(BaseModel):
    id_movimiento: int
    id_lote: int
    id_tipo_movimiento: int
    id_orden: int | None
    cantidad: int
    fecha: datetime
    motivo: str | None

    model_config = {"from_attributes": True}
