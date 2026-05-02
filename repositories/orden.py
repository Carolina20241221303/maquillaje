"""Repositorio de Orden y DetalleOrden."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.orden import DetalleOrden, Orden


class OrdenRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, orden_id: int) -> Orden | None:
        """Carga detalles → producto (con categoria lazy-loaded automáticamente)."""
        stmt = (
            select(Orden)
            .options(
                selectinload(Orden.detalles).selectinload(DetalleOrden.producto),
                selectinload(Orden.direccion),
                selectinload(Orden.usuario),
                selectinload(Orden.pago),
            )
            .execution_options(populate_existing=True)
            .where(Orden.id_orden == orden_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_usuario(self, user_id: int, *, skip: int = 0, limit: int = 20) -> list[Orden]:
        stmt = (
            select(Orden)
            .options(
                selectinload(Orden.detalles).selectinload(DetalleOrden.producto),
                selectinload(Orden.direccion),
                selectinload(Orden.usuario),
            )
            .where(Orden.id_usuario == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(Orden.fecha_orden.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_all(self, *, skip: int = 0, limit: int = 50, estado: str | None = None) -> list[Orden]:
        stmt = (
            select(Orden)
            .options(
                selectinload(Orden.detalles).selectinload(DetalleOrden.producto),
                selectinload(Orden.direccion),
                selectinload(Orden.usuario),
            )
        )
        if estado:
            stmt = stmt.where(Orden.estado == estado)
        stmt = stmt.offset(skip).limit(limit).order_by(Orden.fecha_orden.desc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, orden: Orden) -> Orden:
        self.db.add(orden)
        await self.db.flush()
        await self.db.refresh(orden)
        return orden

    async def update_estado(self, orden: Orden, estado: str) -> Orden:
        orden.estado = estado
        await self.db.flush()
        # Re-cargar con relaciones para serialización segura en respuestas.
        refreshed = await self.get_by_id(orden.id_orden)
        return refreshed if refreshed is not None else orden

    async def add_detalle(self, detalle: DetalleOrden) -> DetalleOrden:
        self.db.add(detalle)
        await self.db.flush()
        await self.db.refresh(detalle)
        return detalle
