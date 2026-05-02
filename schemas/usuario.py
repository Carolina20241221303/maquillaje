"""Schemas de Usuario y Cliente."""

from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field


class UsuarioCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    apellido: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    id_rol: int


class UsuarioUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=100)
    apellido: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = None
    activo: bool | None = None
    id_rol: int | None = None


class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre: str
    apellido: str
    email: str
    id_rol: int
    activo: bool
    fecha_registro: datetime

    model_config = {"from_attributes": True}


class ClienteUpdate(BaseModel):
    telefono: str | None = Field(None, max_length=20)
    documento_identidad: str | None = Field(None, max_length=20)
    fecha_nacimiento: date | None = None


class ClienteResponse(BaseModel):
    id_usuario: int
    telefono: str | None
    documento_identidad: str | None
    fecha_nacimiento: date | None

    model_config = {"from_attributes": True}


class RolResponse(BaseModel):
    id_rol: int
    nombre_rol: str
    descripcion: str | None

    model_config = {"from_attributes": True}
