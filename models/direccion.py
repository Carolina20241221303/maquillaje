"""Modelo de Dirección de Envío."""

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DireccionEnvio(Base):
    __tablename__ = "direccion_envio"
    __table_args__ = {"schema": "tienda"}

    id_direccion: Mapped[int] = mapped_column(primary_key=True)
    id_usuario: Mapped[int] = mapped_column(ForeignKey("tienda.usuario.id_usuario", ondelete="CASCADE"), nullable=False)
    nombre_destinatario: Mapped[str] = mapped_column(String(150), nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(20))
    direccion: Mapped[str] = mapped_column(String(250), nullable=False)
    id_ciudad: Mapped[int] = mapped_column(ForeignKey("tienda.ciudad.id_ciudad"), nullable=False)
    codigo_postal: Mapped[str | None] = mapped_column(String(10))
    es_principal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    activa: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    usuario: Mapped["Usuario"] = relationship(back_populates="direcciones", lazy="selectin")
    ciudad: Mapped["Ciudad"] = relationship(lazy="selectin")


from app.models.usuario import Usuario  # noqa: E402
from app.models.geografia import Ciudad  # noqa: E402
