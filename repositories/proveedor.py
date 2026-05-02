"""Repositorio de Proveedores y ProductoProveedor."""

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.proveedor import ProductoProveedor, Proveedor


class ProveedorRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, prov_id: int) -> Proveedor | None:
        stmt = select(Proveedor).where(Proveedor.id_proveedor == prov_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self, *, skip: int = 0, limit: int = 50) -> list[Proveedor]:
        stmt = select(Proveedor).offset(skip).limit(limit).order_by(Proveedor.id_proveedor)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, prov: Proveedor) -> Proveedor:
        self.db.add(prov)
        await self.db.flush()
        await self.db.refresh(prov)
        return prov

    async def update(self, prov: Proveedor, data: dict) -> Proveedor:
        for key, value in data.items():
            if value is not None:
                setattr(prov, key, value)
        await self.db.flush()
        await self.db.refresh(prov)
        return prov

    async def delete(self, prov: Proveedor) -> None:
        await self.db.delete(prov)
        await self.db.flush()


class ProductoProveedorRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get(self, id_producto: int, id_proveedor: int) -> ProductoProveedor | None:
        stmt = select(ProductoProveedor).where(
            and_(
                ProductoProveedor.id_producto == id_producto,
                ProductoProveedor.id_proveedor == id_proveedor,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_producto(self, prod_id: int) -> list[ProductoProveedor]:
        stmt = (
            select(ProductoProveedor)
            .options(selectinload(ProductoProveedor.proveedor))
            .where(ProductoProveedor.id_producto == prod_id)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_by_proveedor(self, prov_id: int) -> list[ProductoProveedor]:
        stmt = (
            select(ProductoProveedor)
            .options(selectinload(ProductoProveedor.producto))
            .where(ProductoProveedor.id_proveedor == prov_id)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, pp: ProductoProveedor) -> ProductoProveedor:
        self.db.add(pp)
        await self.db.flush()
        await self.db.refresh(pp)
        return pp

    async def delete(self, pp: ProductoProveedor) -> None:
        await self.db.delete(pp)
        await self.db.flush()
