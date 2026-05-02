"""Modelos de Orden y DetalleOrden."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Orden(Base):
    __tablename__ = "orden"
    __table_args__ = {"schema": "tienda"}

    id_orden: Mapped[int] = mapped_column(primary_key=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("tienda.usuario.id_usuario"), nullable=False)
    id_direccion: Mapped[int] = mapped_column(ForeignKey("tienda.direccion_envio.id_direccion"), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="pendiente")
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    descuento: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    iva_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    fecha_orden: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    fecha_actualizacion: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    notas: Mapped[str | None] = mapped_column(Text)

    usuario: Mapped["Usuario"] = relationship(back_populates="ordenes", lazy="selectin")
    direccion: Mapped["DireccionEnvio"] = relationship(lazy="selectin")
    detalles: Mapped[list["DetalleOrden"]] = relationship(back_populates="orden", lazy="selectin", cascade="all, delete-orphan")
    pago: Mapped["Pago | None"] = relationship(back_populates="orden", uselist=False, lazy="selectin")


class DetalleOrden(Base):
    __tablename__ = "detalle_orden"
    __table_args__ = {"schema": "tienda"}

    id_detalle: Mapped[int] = mapped_column(primary_key=True)
    id_orden: Mapped[int] = mapped_column(ForeignKey("tienda.orden.id_orden", ondelete="CASCADE"), nullable=False)
    id_producto: Mapped[int] = mapped_column(ForeignKey("tienda.producto.id_producto"), nullable=False)
    id_variante: Mapped[int | None] = mapped_column(ForeignKey("tienda.producto_variante.id_variante"))
    tipo_variante: Mapped[str | None] = mapped_column(String(60))
    nombre_variante: Mapped[str | None] = mapped_column(String(120))
    color_hex_variante: Mapped[str | None] = mapped_column(String(7))
    id_lote: Mapped[int | None] = mapped_column(ForeignKey("tienda.lote.id_lote"))
    cantidad: Mapped[int] = mapped_column(nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    porcentaje_iva: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("0"))
    subtotal_linea: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    orden: Mapped["Orden"] = relationship(back_populates="detalles", lazy="selectin")
    producto: Mapped["Producto"] = relationship(lazy="selectin")


from app.models.usuario import Usuario  # noqa: E402
from app.models.direccion import DireccionEnvio  # noqa: E402
from app.models.catalogo import Producto  # noqa: E402
from app.models.pago import Pago  # noqa: E402
