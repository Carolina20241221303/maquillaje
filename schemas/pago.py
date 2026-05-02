"""Schemas de Pago simulado."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class PagoCreate(BaseModel):
    id_orden: int
    metodo_pago: str = Field(default="tarjeta_credito", max_length=20)
    ultimos4: str = Field(..., min_length=4, max_length=4)
    nombre_titular: str = Field(..., min_length=1, max_length=150)

    @field_validator("ultimos4")
    @classmethod
    def validate_ultimos4(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("ultimos4 debe contener exactamente 4 dígitos")
        return v


class PagoUpdateEstado(BaseModel):
    estado_pago: str = Field(..., pattern=r"^(pendiente|aprobado|rechazado)$")


class PagoResponse(BaseModel):
    id_pago: int
    id_orden: int
    metodo_pago: str
    ultimos4: str
    nombre_titular: str
    estado_pago: str
    monto: Decimal
    fecha_pago: datetime
    referencia_simulada: str | None

    model_config = {"from_attributes": True}
