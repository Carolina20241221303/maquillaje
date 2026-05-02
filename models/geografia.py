"""Modelos de Geografía: Departamento y Ciudad."""

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Departamento(Base):
    __tablename__ = "departamento"
    __table_args__ = {"schema": "tienda"}

    id_departamento: Mapped[int] = mapped_column(primary_key=True)
    nombre_departamento: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    ciudades: Mapped[list["Ciudad"]] = relationship(back_populates="departamento", lazy="selectin")


class Ciudad(Base):
    __tablename__ = "ciudad"
    __table_args__ = {"schema": "tienda"}

    id_ciudad: Mapped[int] = mapped_column(primary_key=True)
    nombre_ciudad: Mapped[str] = mapped_column(String(100), nullable=False)
    id_departamento: Mapped[int] = mapped_column(ForeignKey("tienda.departamento.id_departamento"), nullable=False)

    departamento: Mapped["Departamento"] = relationship(back_populates="ciudades", lazy="selectin")
