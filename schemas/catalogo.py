"""Schemas de Catálogo: Categoria, Marca, UnidadMedida, Producto, PrecioProducto."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


# ── Categoría ──
class CategoriaCreate(BaseModel):
    nombre_categoria: str = Field(..., min_length=1, max_length=100)
    descripcion: str | None = None
    porcentaje_iva: Decimal = Field(default=Decimal("19.00"), ge=0, le=100)


class CategoriaUpdate(BaseModel):
    nombre_categoria: str | None = Field(None, min_length=1, max_length=100)
    descripcion: str | None = None
    porcentaje_iva: Decimal | None = Field(None, ge=0, le=100)


class CategoriaResponse(BaseModel):
    id_categoria: int
    nombre_categoria: str
    descripcion: str | None
    porcentaje_iva: Decimal

    model_config = {"from_attributes": True}


# ── Marca ──
class MarcaCreate(BaseModel):
    nombre_marca: str = Field(..., min_length=1, max_length=100)
    pais_origen: str | None = Field(None, max_length=80)
    sitio_web: str | None = Field(None, max_length=200)


class MarcaUpdate(BaseModel):
    nombre_marca: str | None = Field(None, min_length=1, max_length=100)
    pais_origen: str | None = Field(None, max_length=80)
    sitio_web: str | None = Field(None, max_length=200)


class MarcaResponse(BaseModel):
    id_marca: int
    nombre_marca: str
    pais_origen: str | None
    sitio_web: str | None

    model_config = {"from_attributes": True}


# ── Unidad de Medida ──
class UnidadMedidaCreate(BaseModel):
    nombre_unidad: str = Field(..., min_length=1, max_length=30)
    abreviatura: str = Field(..., min_length=1, max_length=10)


class UnidadMedidaUpdate(BaseModel):
    nombre_unidad: str | None = Field(None, min_length=1, max_length=30)
    abreviatura: str | None = Field(None, min_length=1, max_length=10)


class UnidadMedidaResponse(BaseModel):
    id_unidad_medida: int
    nombre_unidad: str
    abreviatura: str

    model_config = {"from_attributes": True}


# ── Producto ──
class ProductoCreate(BaseModel):
    codigo_barras: str | None = Field(None, max_length=50)
    nombre_producto: str = Field(..., min_length=1, max_length=200)
    descripcion: str | None = None
    tono: str | None = Field(None, max_length=80)
    variante_tipo: str | None = Field(None, max_length=60)
    variante_valor: str | None = Field(None, max_length=120)
    variante_color_hex: str | None = Field(None, pattern=r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
    id_categoria: int
    id_marca: int
    contenido_neto: Decimal | None = Field(None, ge=0)
    id_unidad_medida: int | None = None
    imagen_url: str | None = Field(None, max_length=300)


class ProductoUpdate(BaseModel):
    codigo_barras: str | None = Field(None, max_length=50)
    nombre_producto: str | None = Field(None, min_length=1, max_length=200)
    descripcion: str | None = None
    tono: str | None = Field(None, max_length=80)
    variante_tipo: str | None = Field(None, max_length=60)
    variante_valor: str | None = Field(None, max_length=120)
    variante_color_hex: str | None = Field(None, pattern=r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
    id_categoria: int | None = None
    id_marca: int | None = None
    contenido_neto: Decimal | None = Field(None, ge=0)
    id_unidad_medida: int | None = None
    imagen_url: str | None = Field(None, max_length=300)
    activo: bool | None = None


class ProductoResponse(BaseModel):
    id_producto: int
    codigo_barras: str | None
    nombre_producto: str
    descripcion: str | None
    tono: str | None
    variante_tipo: str | None
    variante_valor: str | None
    variante_color_hex: str | None
    id_categoria: int
    id_marca: int
    contenido_neto: Decimal | None
    id_unidad_medida: int | None
    imagen_url: str | None
    activo: bool

    model_config = {"from_attributes": True}


class ProductoVarianteCreate(BaseModel):
    nombre_variante: str = Field(..., min_length=1, max_length=120)
    color_hex: str | None = Field(None, pattern=r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
    orden: int = Field(default=1, ge=1)
    activo: bool = True


class ProductoVarianteUpdate(BaseModel):
    nombre_variante: str | None = Field(None, min_length=1, max_length=120)
    color_hex: str | None = Field(None, pattern=r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
    orden: int | None = Field(None, ge=1)
    activo: bool | None = None


class ProductoVarianteResponse(BaseModel):
    id_variante: int | None
    id_producto: int
    nombre_variante: str
    color_hex: str | None
    orden: int
    activo: bool

    model_config = {"from_attributes": True}


class ProductoDetalleResponse(ProductoResponse):
    """Producto con información de categoría, marca, precio vigente e inventario."""
    nombre_categoria: str | None = None
    nombre_marca: str | None = None
    precio_venta: Decimal | None = None
    precio_con_iva: Decimal | None = None
    porcentaje_iva: Decimal | None = None
    stock_actual: int = 0
    variantes: list[ProductoVarianteResponse] = Field(default_factory=list)


# ── Precio Producto ──
class PrecioCreate(BaseModel):
    id_producto: int
    precio_venta: Decimal = Field(..., gt=0)
    fecha_inicio: date | None = None


class PrecioResponse(BaseModel):
    id_precio: int
    id_producto: int
    precio_venta: Decimal
    fecha_inicio: date
    fecha_fin: date | None

    model_config = {"from_attributes": True}
