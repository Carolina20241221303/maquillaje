"""Modelos de Usuarios: Rol, Usuario, Cliente."""

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Rol(Base):
    __tablename__ = "rol"
    __table_args__ = {"schema": "tienda"}

    id_rol: Mapped[int] = mapped_column(primary_key=True)
    nombre_rol: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(150))

    usuarios: Mapped[list["Usuario"]] = relationship(back_populates="rol", lazy="selectin")


class Usuario(Base):
    __tablename__ = "usuario"
    __table_args__ = {"schema": "tienda"}

    id_usuario: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    id_rol: Mapped[int] = mapped_column(ForeignKey("tienda.rol.id_rol"), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    fecha_registro: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    rol: Mapped["Rol"] = relationship(back_populates="usuarios", lazy="selectin")
    cliente: Mapped["Cliente | None"] = relationship(back_populates="usuario", uselist=False, lazy="selectin")
    direcciones: Mapped[list["DireccionEnvio"]] = relationship(back_populates="usuario", lazy="selectin")
    ordenes: Mapped[list["Orden"]] = relationship(back_populates="usuario", lazy="selectin")


class Cliente(Base):
    __tablename__ = "cliente"
    __table_args__ = {"schema": "tienda"}

    id_usuario: Mapped[int] = mapped_column(ForeignKey("tienda.usuario.id_usuario", ondelete="CASCADE"), primary_key=True)
    telefono: Mapped[str | None] = mapped_column(String(20))
    documento_identidad: Mapped[str | None] = mapped_column(String(20))
    fecha_nacimiento: Mapped[date | None] = mapped_column(Date)

    usuario: Mapped["Usuario"] = relationship(back_populates="cliente", lazy="selectin")


# Importaciones diferidas para evitar ciclos
from app.models.direccion import DireccionEnvio  # noqa: E402
from app.models.orden import Orden  # noqa: E402
