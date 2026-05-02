"""Router de Proveedores."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.proveedor import (
    ProductoProveedorCreate,
    ProductoProveedorResponse,
    ProveedorCreate,
    ProveedorResponse,
    ProveedorUpdate,
)
from app.services.proveedor import ProveedorService
from app.dependencies import require_roles

router = APIRouter()


# ── Asociaciones Producto-Proveedor (específicas primero) ──
@router.post("/productos-proveedores", response_model=ProductoProveedorResponse)
async def associate_producto_proveedor(
    data: ProductoProveedorCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = ProveedorService(db)
    return await service.associate_producto(data)


@router.get("/productos/{prod_id}/proveedores", response_model=list[ProductoProveedorResponse])
async def list_proveedores_by_producto(
    prod_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = ProveedorService(db)
    return await service.list_proveedores_by_producto(prod_id)


# ── Proveedores ──
@router.get("/", response_model=list[ProveedorResponse])
async def list_proveedores(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = ProveedorService(db)
    return await service.list_proveedores(skip=skip, limit=limit)


@router.post("/", response_model=ProveedorResponse)
async def create_proveedor(
    data: ProveedorCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = ProveedorService(db)
    return await service.create_proveedor(data)


@router.get("/{prov_id}", response_model=ProveedorResponse)
async def get_proveedor(
    prov_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = ProveedorService(db)
    return await service.get_proveedor(prov_id)


@router.get("/{prov_id}/productos", response_model=list[ProductoProveedorResponse])
async def list_productos_by_proveedor(
    prov_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = ProveedorService(db)
    return await service.list_productos_by_proveedor(prov_id)


@router.put("/{prov_id}", response_model=ProveedorResponse)
async def update_proveedor(
    prov_id: int,
    data: ProveedorUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = ProveedorService(db)
    return await service.update_proveedor(prov_id, data)


@router.delete("/{prov_id}")
async def delete_proveedor(
    prov_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = ProveedorService(db)
    await service.delete_proveedor(prov_id)
    return {"message": "Proveedor eliminado"}


@router.delete("/productos/{prod_id}/proveedores/{prov_id}")
async def remove_association(
    prod_id: int,
    prov_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = ProveedorService(db)
    await service.remove_association(prod_id, prov_id)
    return {"message": "Asociación eliminada"}