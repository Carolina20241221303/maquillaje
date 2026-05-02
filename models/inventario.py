"""Modelos de Inventario: Lote, Inventario, TipoMovimiento, MovimientoInventario."""

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Lote(Base):
    __tablename__ = "lote"
    __table_args__ = {"schema": "tienda"}

    id_lote: Mapped[int] = mapped_column(primary_key=True)
    id_producto: Mapped[int] = mapped_column(ForeignKey("tienda.producto.id_producto"), nullable=False)
    id_proveedor: Mapped[int | None] = mapped_column(ForeignKey("tienda.proveedor.id_proveedor"))
    numero_lote: Mapped[str | None] = mapped_column(String(80))
    fecha_vencimiento: Mapped[date | None] = mapped_column(Date)
    fecha_ingreso: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    cantidad_inicial: Mapped[int] = mapped_column(nullable=False)

    producto: Mapped["Producto"] = relationship(lazy="selectin")
    proveedor: Mapped["Proveedor | None"] = relationship(lazy="selectin")
    movimientos: Mapped[list["MovimientoInventario"]] = relationship(back_populates="lote", lazy="selectin")


class Inventario(Base):
    __tablename__ = "inventario"
    __table_args__ = {"schema": "tienda"}

    id_producto: Mapped[int] = mapped_column(ForeignKey("tienda.producto.id_producto"), primary_key=True)
    stock_actual: Mapped[int] = mapped_column(nullable=False, default=0)
    stock_minimo: Mapped[int] = mapped_column(nullable=False, default=0)
    stock_maximo: Mapped[int | None] = mapped_column()
    ubicacion_tienda: Mapped[str | None] = mapped_column(String(80))
    ultima_actualizacion: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    producto: Mapped["Producto"] = relationship(lazy="selectin")


class TipoMovimiento(Base):
    __tablename__ = "tipo_movimiento"
    __table_args__ = {"schema": "tienda"}

    id_tipo_movimiento: Mapped[int] = mapped_column(primary_key=True)
    nombre_tipo: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(150))
    afecta_stock: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class MovimientoInventario(Base):
    __tablename__ = "movimiento_inventario"
    __table_args__ = {"schema": "tienda"}

    id_movimiento: Mapped[int] = mapped_column(primary_key=True)
    id_lote: Mapped[int] = mapped_column(ForeignKey("tienda.lote.id_lote"), nullable=False)
    id_tipo_movimiento: Mapped[int] = mapped_column(ForeignKey("tienda.tipo_movimiento.id_tipo_movimiento"), nullable=False)
    id_orden: Mapped[int | None] = mapped_column(ForeignKey("tienda.orden.id_orden"))
    cantidad: Mapped[int] = mapped_column(nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    motivo: Mapped[str | None] = mapped_column(String(200))

    lote: Mapped["Lote"] = relationship(back_populates="movimientos", lazy="selectin")
    tipo_movimiento: Mapped["TipoMovimiento"] = relationship(lazy="selectin")


from app.models.catalogo import Producto  # noqa: E402
from app.models.proveedor import Proveedor  # noqa: E402
