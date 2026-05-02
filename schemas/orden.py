"""Schemas de Orden y DetalleOrden."""

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


# ── Items para crear una orden ──
class OrdenItemCreate(BaseModel):
    id_producto: int
    id_variante: int | None = None
    cantidad: int = Field(..., gt=0)


class OrdenCreate(BaseModel):
    id_direccion: int
    items: list[OrdenItemCreate] = Field(..., min_length=1)
    notas: str | None = None
    descuento: Decimal = Field(default=Decimal("0"), ge=0)


class OrdenUpdateEstado(BaseModel):
    estado: str = Field(..., pattern=r"^(pendiente|procesando|enviado|entregado|cancelado)$")


# ── Respuestas ──
class DireccionEnvioResponse(BaseModel):
    nombre_destinatario: str
    telefono: str | None = None
    direccion: str
    ciudad: str | None = None
    departamento: str | None = None
    codigo_postal: str | None = None

    model_config = {"from_attributes": True}


class DetalleOrdenResponse(BaseModel):
    id_detalle: int | None = None
    id_orden: int
    id_producto: int
    id_variante: int | None
    tipo_variante: str | None = None
    nombre_variante: str | None = None
    color_hex_variante: str | None = None
    id_lote: int | None
    cantidad: int
    precio_unitario: Decimal
    porcentaje_iva: Decimal
    subtotal_linea: Decimal
    nombre_producto: str | None = None
    nombre_categoria: str | None = None

    model_config = {"from_attributes": True}


class OrdenResponse(BaseModel):
    id_orden: int
    id_usuario: int
    id_direccion: int
    estado: str
    subtotal: Decimal
    descuento: Decimal
    iva_total: Decimal
    total: Decimal
    fecha_orden: datetime
    fecha_actualizacion: datetime
    notas: str | None
    email_usuario: str | None = None
    detalles: list[DetalleOrdenResponse] = []
    direccion_envio: DireccionEnvioResponse | None = None

    model_config = {"from_attributes": True}


def orden_to_dict(orden: Any) -> dict:
    """
    Convierte un ORM Orden a dict incluyendo nombre_producto,
    nombre_categoria y dirección de envío completa.
    """
    detalles = []
    for d in (orden.detalles or []):
        nombre_producto = None
        nombre_categoria = None
        if d.producto is not None:
            nombre_producto = d.producto.nombre_producto
            if d.producto.categoria is not None:
                nombre_categoria = d.producto.categoria.nombre_categoria

        detalles.append({
            "id_detalle":       getattr(d, "id_detalle", None),
            "id_orden":         d.id_orden,
            "id_producto":      d.id_producto,
            "id_variante":      getattr(d, "id_variante", None),
            "tipo_variante":    getattr(d, "tipo_variante", None),
            "nombre_variante":  getattr(d, "nombre_variante", None),
            "color_hex_variante": getattr(d, "color_hex_variante", None),
            "id_lote":          d.id_lote,
            "cantidad":         d.cantidad,
            "precio_unitario":  d.precio_unitario,
            "porcentaje_iva":   d.porcentaje_iva,
            "subtotal_linea":   d.subtotal_linea,
            "nombre_producto":  nombre_producto,
            "nombre_categoria": nombre_categoria,
        })

    # Dirección de envío
    direccion_envio = None
    if orden.direccion is not None:
        d = orden.direccion
        ciudad = None
        departamento = None
        if hasattr(d, "ciudad") and d.ciudad is not None:
            ciudad = d.ciudad.nombre_ciudad
            if hasattr(d.ciudad, "departamento") and d.ciudad.departamento is not None:
                departamento = d.ciudad.departamento.nombre_departamento
        direccion_envio = {
            "nombre_destinatario": d.nombre_destinatario,
            "telefono":            getattr(d, "telefono", None),
            "direccion":           d.direccion,
            "ciudad":              ciudad,
            "departamento":        departamento,
            "codigo_postal":       d.codigo_postal,
        }

    return {
        "id_orden":            orden.id_orden,
        "id_usuario":          orden.id_usuario,
        "id_direccion":        orden.id_direccion,
        "estado":              orden.estado,
        "subtotal":            orden.subtotal,
        "descuento":           orden.descuento,
        "iva_total":           orden.iva_total,
        "total":               orden.total,
        "fecha_orden":         orden.fecha_orden,
        "fecha_actualizacion": orden.fecha_actualizacion,
        "notas":               orden.notas,
        "email_usuario":       orden.usuario.email if getattr(orden, "usuario", None) is not None else None,
        "detalles":            detalles,
        "direccion_envio":     direccion_envio,
    }
