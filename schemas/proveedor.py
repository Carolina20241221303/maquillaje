"""Schemas de Proveedor y ProductoProveedor."""

from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field


class ProveedorCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=150)
    nit: str = Field(..., min_length=1, max_length=20)
    telefono: str | None = Field(None, max_length=20)
    email: EmailStr | None = None
    direccion: str | None = Field(None, max_length=200)
    id_ciudad: int | None = None


class ProveedorUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=150)
    nit: str | None = Field(None, min_length=1, max_length=20)
    telefono: str | None = Field(None, max_length=20)
    email: EmailStr | None = None
    direccion: str | None = Field(None, max_length=200)
    id_ciudad: int | None = None


class ProveedorResponse(BaseModel):
    id_proveedor: int
    nombre: str
    nit: str
    telefono: str | None
    email: str | None
    direccion: str | None
    id_ciudad: int | None

    model_config = {"from_attributes": True}


class ProductoProveedorCreate(BaseModel):
    id_producto: int
    id_proveedor: int
    precio_pacto: Decimal | None = Field(None, ge=0)
    es_principal: bool = False


class ProductoProveedorResponse(BaseModel):
    id_producto: int
    id_proveedor: int
    precio_pacto: Decimal | None
    es_principal: bool

    model_config = {"from_attributes": True}
