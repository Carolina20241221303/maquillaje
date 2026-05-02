"""Schemas de Dirección de Envío."""

from pydantic import BaseModel, Field


class DireccionCreate(BaseModel):
    nombre_destinatario: str = Field(..., min_length=1, max_length=150)
    telefono: str | None = Field(None, max_length=20)
    direccion: str = Field(..., min_length=1, max_length=250)
    id_ciudad: int
    codigo_postal: str | None = Field(None, max_length=10)
    es_principal: bool = False


class DireccionUpdate(BaseModel):
    nombre_destinatario: str | None = Field(None, min_length=1, max_length=150)
    telefono: str | None = Field(None, max_length=20)
    direccion: str | None = Field(None, min_length=1, max_length=250)
    id_ciudad: int | None = None
    codigo_postal: str | None = Field(None, max_length=10)
    es_principal: bool | None = None
    activa: bool | None = None


class DireccionResponse(BaseModel):
    id_direccion: int
    id_usuario: int
    nombre_destinatario: str
    telefono: str | None
    direccion: str
    id_ciudad: int
    codigo_postal: str | None
    es_principal: bool
    activa: bool
    ciudad: str | None = None
    departamento: str | None = None

    model_config = {"from_attributes": True}
