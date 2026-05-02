"""Modelos de Catálogo: Categoria, Marca, UnidadMedida, Producto, PrecioProducto."""

from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Categoria(Base):
    __tablename__ = "categoria"
    __table_args__ = {"schema": "tienda"}

    id_categoria: Mapped[int] = mapped_column(primary_key=True)
    nombre_categoria: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)
    porcentaje_iva: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("19.00"))

    productos: Mapped[list["Producto"]] = relationship(back_populates="categoria", lazy="selectin")


class Marca(Base):
    __tablename__ = "marca"
    __table_args__ = {"schema": "tienda"}

    id_marca: Mapped[int] = mapped_column(primary_key=True)
    nombre_marca: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    pais_origen: Mapped[str | None] = mapped_column(String(80))
    sitio_web: Mapped[str | None] = mapped_column(String(200))

    productos: Mapped[list["Producto"]] = relationship(back_populates="marca", lazy="selectin")


class UnidadMedida(Base):
    __tablename__ = "unidad_medida"
    __table_args__ = {"schema": "tienda"}

    id_unidad_medida: Mapped[int] = mapped_column(primary_key=True)
    nombre_unidad: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    abreviatura: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)


class Producto(Base):
    __tablename__ = "producto"
    __table_args__ = {"schema": "tienda"}

    id_producto: Mapped[int] = mapped_column(primary_key=True)
    codigo_barras: Mapped[str | None] = mapped_column(String(50), unique=True)
    nombre_producto: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text)
    tono: Mapped[str | None] = mapped_column(String(80))
    variante_tipo: Mapped[str | None] = mapped_column(String(60))
    variante_valor: Mapped[str | None] = mapped_column(String(120))
    variante_color_hex: Mapped[str | None] = mapped_column(String(7))
    id_categoria: Mapped[int] = mapped_column(ForeignKey("tienda.categoria.id_categoria"), nullable=False)
    id_marca: Mapped[int] = mapped_column(ForeignKey("tienda.marca.id_marca"), nullable=False)
    contenido_neto: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    id_unidad_medida: Mapped[int | None] = mapped_column(ForeignKey("tienda.unidad_medida.id_unidad_medida"))
    imagen_url: Mapped[str | None] = mapped_column(String(300))
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    categoria: Mapped["Categoria"] = relationship(back_populates="productos", lazy="selectin")
    marca: Mapped["Marca"] = relationship(back_populates="productos", lazy="selectin")
    unidad_medida: Mapped["UnidadMedida | None"] = relationship(lazy="selectin")
    precios: Mapped[list["PrecioProducto"]] = relationship(back_populates="producto", lazy="selectin")
    variantes: Mapped[list["ProductoVariante"]] = relationship(
        back_populates="producto",
        lazy="selectin",
        cascade="all, delete-orphan",
    )


class ProductoVariante(Base):
    __tablename__ = "producto_variante"
    __table_args__ = {"schema": "tienda"}

    id_variante: Mapped[int] = mapped_column(primary_key=True)
    id_producto: Mapped[int] = mapped_column(ForeignKey("tienda.producto.id_producto", ondelete="CASCADE"), nullable=False)
    nombre_variante: Mapped[str] = mapped_column(String(120), nullable=False)
    color_hex: Mapped[str | None] = mapped_column(String(7))
    orden: Mapped[int] = mapped_column(nullable=False, default=1)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    producto: Mapped["Producto"] = relationship(back_populates="variantes", lazy="selectin")


class PrecioProducto(Base):
    __tablename__ = "precio_producto"
    __table_args__ = {"schema": "tienda"}

    id_precio: Mapped[int] = mapped_column(primary_key=True)
    id_producto: Mapped[int] = mapped_column(ForeignKey("tienda.producto.id_producto"), nullable=False)
    precio_venta: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    fecha_fin: Mapped[date | None] = mapped_column(Date)

    producto: Mapped["Producto"] = relationship(back_populates="precios", lazy="selectin")
