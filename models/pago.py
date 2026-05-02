"""Modelo de Pago simulado."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Pago(Base):
    __tablename__ = "pago"
    __table_args__ = {"schema": "tienda"}

    id_pago: Mapped[int] = mapped_column(primary_key=True)
    id_orden: Mapped[int] = mapped_column(ForeignKey("tienda.orden.id_orden"), unique=True, nullable=False)
    metodo_pago: Mapped[str] = mapped_column(String(20), nullable=False, default="tarjeta_credito")
    ultimos4: Mapped[str] = mapped_column(String(4), nullable=False)
    nombre_titular: Mapped[str] = mapped_column(String(150), nullable=False)
    estado_pago: Mapped[str] = mapped_column(String(15), nullable=False, default="pendiente")
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    fecha_pago: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    referencia_simulada: Mapped[str | None] = mapped_column(String(50), unique=True)

    orden: Mapped["Orden"] = relationship(back_populates="pago", lazy="selectin")


from app.models.orden import Orden  # noqa: E402
