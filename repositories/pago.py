"""Repositorio de Pago."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pago import Pago


class PagoRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, pago_id: int) -> Pago | None:
        stmt = select(Pago).where(Pago.id_pago == pago_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_orden(self, orden_id: int) -> Pago | None:
        stmt = select(Pago).where(Pago.id_orden == orden_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, pago: Pago) -> Pago:
        self.db.add(pago)
        await self.db.flush()
        await self.db.refresh(pago)
        return pago

    async def update_estado(self, pago: Pago, estado: str) -> Pago:
        pago.estado_pago = estado
        await self.db.flush()
        await self.db.refresh(pago)
        return pago
