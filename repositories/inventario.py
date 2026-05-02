"""Repositorio de Inventario: Lote, Inventario, TipoMovimiento, MovimientoInventario."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.inventario import Inventario, Lote, MovimientoInventario, TipoMovimiento


class LoteRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, lote_id: int) -> Lote | None:
        stmt = (
            select(Lote)
            .options(selectinload(Lote.producto), selectinload(Lote.proveedor))
            .where(Lote.id_lote == lote_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_producto(self, prod_id: int) -> list[Lote]:
        stmt = (
            select(Lote)
            .where(Lote.id_producto == prod_id)
            .order_by(Lote.fecha_ingreso.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_all(self, *, skip: int = 0, limit: int = 50) -> list[Lote]:
        stmt = (
            select(Lote)
            .options(selectinload(Lote.producto))
            .offset(skip)
            .limit(limit)
            .order_by(Lote.id_lote.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, lote: Lote) -> Lote:
        self.db.add(lote)
        await self.db.flush()
        await self.db.refresh(lote)
        return lote


class InventarioRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_producto(self, prod_id: int) -> Inventario | None:
        stmt = (
            select(Inventario)
            .options(selectinload(Inventario.producto))
            .where(Inventario.id_producto == prod_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self, *, skip: int = 0, limit: int = 50) -> list[Inventario]:
        stmt = (
            select(Inventario)
            .options(selectinload(Inventario.producto))
            .offset(skip)
            .limit(limit)
            .order_by(Inventario.id_producto)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, inv: Inventario) -> Inventario:
        self.db.add(inv)
        await self.db.flush()
        await self.db.refresh(inv)
        return inv

    async def update_stock(self, inv: Inventario, delta: int) -> Inventario:
        """Suma (o resta si negativo) delta al stock_actual."""
        inv.stock_actual += delta
        if inv.stock_actual < 0:
            raise ValueError("Stock insuficiente")
        await self.db.flush()
        await self.db.refresh(inv)
        return inv

    async def update(self, inv: Inventario, data: dict) -> Inventario:
        for key, value in data.items():
            if value is not None:
                setattr(inv, key, value)
        await self.db.flush()
        await self.db.refresh(inv)
        return inv


class TipoMovimientoRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, tipo_id: int) -> TipoMovimiento | None:
        stmt = select(TipoMovimiento).where(TipoMovimiento.id_tipo_movimiento == tipo_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_nombre(self, nombre: str) -> TipoMovimiento | None:
        stmt = select(TipoMovimiento).where(TipoMovimiento.nombre_tipo == nombre)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self) -> list[TipoMovimiento]:
        stmt = select(TipoMovimiento).order_by(TipoMovimiento.id_tipo_movimiento)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())


class MovimientoInventarioRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_by_lote(self, lote_id: int) -> list[MovimientoInventario]:
        stmt = (
            select(MovimientoInventario)
            .options(selectinload(MovimientoInventario.tipo_movimiento))
            .where(MovimientoInventario.id_lote == lote_id)
            .order_by(MovimientoInventario.fecha.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_by_orden(self, orden_id: int) -> list[MovimientoInventario]:
        stmt = (
            select(MovimientoInventario)
            .where(MovimientoInventario.id_orden == orden_id)
            .order_by(MovimientoInventario.fecha.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_all(self, *, skip: int = 0, limit: int = 50) -> list[MovimientoInventario]:
        stmt = (
            select(MovimientoInventario)
            .options(selectinload(MovimientoInventario.tipo_movimiento))
            .offset(skip)
            .limit(limit)
            .order_by(MovimientoInventario.id_movimiento.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, mov: MovimientoInventario) -> MovimientoInventario:
        self.db.add(mov)
        await self.db.flush()
        await self.db.refresh(mov)
        return mov
