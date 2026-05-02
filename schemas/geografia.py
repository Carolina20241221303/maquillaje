"""Schemas de Geografía."""

from pydantic import BaseModel, Field


# ── Departamento ──
class DepartamentoCreate(BaseModel):
    nombre_departamento: str = Field(..., min_length=1, max_length=100)


class DepartamentoUpdate(BaseModel):
    nombre_departamento: str | None = Field(None, min_length=1, max_length=100)


class DepartamentoResponse(BaseModel):
    id_departamento: int
    nombre_departamento: str

    model_config = {"from_attributes": True}


# ── Ciudad ──
class CiudadCreate(BaseModel):
    nombre_ciudad: str = Field(..., min_length=1, max_length=100)
    id_departamento: int


class CiudadUpdate(BaseModel):
    nombre_ciudad: str | None = Field(None, min_length=1, max_length=100)
    id_departamento: int | None = None


class CiudadResponse(BaseModel):
    id_ciudad: int
    nombre_ciudad: str
    id_departamento: int
    departamento: DepartamentoResponse | None = None

    model_config = {"from_attributes": True}
