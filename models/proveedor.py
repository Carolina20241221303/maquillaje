"""Modelos de Proveedor y relación N-M Producto-Proveedor."""

from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Proveedor(Base):
    __tablename__ = "proveedor"
    __table_args__ = {"schema": "tienda"}

    id_proveedor: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    nit: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(150), unique=True)
    direccion: Mapped[str | None] = mapped_column(String(200))
    id_ciudad: Mapped[int | None] = mapped_column(ForeignKey("tienda.ciudad.id_ciudad"))

    ciudad: Mapped["Ciudad | None"] = relationship(lazy="selectin")
    productos: Mapped[list["ProductoProveedor"]] = relationship(back_populates="proveedor", lazy="selectin")


class ProductoProveedor(Base):
    __tablename__ = "producto_proveedor"
    __table_args__ = {"schema": "tienda"}

    id_producto: Mapped[int] = mapped_column(ForeignKey("tienda.producto.id_producto"), primary_key=True)
    id_proveedor: Mapped[int] = mapped_column(ForeignKey("tienda.proveedor.id_proveedor"), primary_key=True)
    precio_pacto: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    es_principal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    proveedor: Mapped["Proveedor"] = relationship(back_populates="productos", lazy="selectin")
    producto: Mapped["Producto"] = relationship(lazy="selectin")


from app.models.geografia import Ciudad  # noqa: E402
from app.models.catalogo import Producto  # noqa: E402
