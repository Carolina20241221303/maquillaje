"""Servicio de Proveedores."""

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.proveedor import ProductoProveedor, Proveedor
from app.repositories.proveedor import ProductoProveedorRepository, ProveedorRepository
from app.schemas.proveedor import ProductoProveedorCreate, ProveedorCreate, ProveedorUpdate


class ProveedorService:

    def __init__(self, db: AsyncSession) -> None:
        self.prov_repo = ProveedorRepository(db)
        self.pp_repo = ProductoProveedorRepository(db)

    async def list_proveedores(self, *, skip: int = 0, limit: int = 50) -> list[Proveedor]:
        return await self.prov_repo.list_all(skip=skip, limit=limit)

    async def get_proveedor(self, prov_id: int) -> Proveedor:
        prov = await self.prov_repo.get_by_id(prov_id)
        if not prov:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Proveedor no encontrado")
        return prov

    async def create_proveedor(self, data: ProveedorCreate) -> Proveedor:
        prov = Proveedor(**data.model_dump())
        try:
            return await self.prov_repo.create(prov)
        except IntegrityError as exc:
            raise self._map_integrity_error(exc)

    async def update_proveedor(self, prov_id: int, data: ProveedorUpdate) -> Proveedor:
        prov = await self.get_proveedor(prov_id)
        try:
            return await self.prov_repo.update(prov, data.model_dump(exclude_unset=True))
        except IntegrityError as exc:
            raise self._map_integrity_error(exc)

    async def delete_proveedor(self, prov_id: int) -> None:
        prov = await self.get_proveedor(prov_id)
        await self.prov_repo.delete(prov)

    # ── Producto-Proveedor ──
    async def associate_producto(self, data: ProductoProveedorCreate) -> ProductoProveedor:
        existing = await self.pp_repo.get(data.id_producto, data.id_proveedor)
        if existing:
            raise HTTPException(status.HTTP_409_CONFLICT, "Asociación ya existe")
        pp = ProductoProveedor(**data.model_dump())
        return await self.pp_repo.create(pp)

    async def list_productos_by_proveedor(self, prov_id: int) -> list[ProductoProveedor]:
        await self.get_proveedor(prov_id)
        return await self.pp_repo.list_by_proveedor(prov_id)

    async def list_proveedores_by_producto(self, prod_id: int) -> list[ProductoProveedor]:
        return await self.pp_repo.list_by_producto(prod_id)

    async def remove_association(self, id_producto: int, id_proveedor: int) -> None:
        pp = await self.pp_repo.get(id_producto, id_proveedor)
        if not pp:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Asociación no encontrada")
        await self.pp_repo.delete(pp)

    def _map_integrity_error(self, exc: IntegrityError) -> HTTPException:
        msg = str(exc.orig).lower()
        if "nit" in msg and "unique" in msg:
            return HTTPException(status.HTTP_409_CONFLICT, "Ya existe un proveedor con ese NIT")
        if "email" in msg and "unique" in msg:
            return HTTPException(status.HTTP_409_CONFLICT, "Ya existe un proveedor con ese email")
        if "id_ciudad" in msg and "foreign key" in msg:
            return HTTPException(status.HTTP_409_CONFLICT, "La ciudad seleccionada no existe")
        return HTTPException(status.HTTP_409_CONFLICT, "No se pudo guardar el proveedor por conflicto de datos")
