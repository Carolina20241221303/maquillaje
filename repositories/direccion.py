"""Repositorio de Dirección de Envío."""

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.direccion import DireccionEnvio
from app.models.geografia import Ciudad


class DireccionRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, dir_id: int) -> DireccionEnvio | None:
        stmt = (
            select(DireccionEnvio)
            .options(
                selectinload(DireccionEnvio.ciudad).selectinload(Ciudad.departamento),
            )
            .where(DireccionEnvio.id_direccion == dir_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_usuario(self, user_id: int, *, only_active: bool = True) -> list[DireccionEnvio]:
        stmt = (
            select(DireccionEnvio)
            .options(
                selectinload(DireccionEnvio.ciudad).selectinload(Ciudad.departamento),
            )
            .where(DireccionEnvio.id_usuario == user_id)
        )
        if only_active:
            stmt = stmt.where(DireccionEnvio.activa.is_(True))
        stmt = stmt.order_by(DireccionEnvio.es_principal.desc(), DireccionEnvio.id_direccion)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, direccion: DireccionEnvio) -> DireccionEnvio:
        self.db.add(direccion)
        await self.db.flush()
        await self.db.refresh(direccion)
        return direccion

    async def update(self, direccion: DireccionEnvio, data: dict) -> DireccionEnvio:
        for key, value in data.items():
            setattr(direccion, key, value)
        await self.db.flush()
        await self.db.refresh(direccion)
        return direccion

    async def unset_principal(self, user_id: int) -> None:
        """Quita es_principal de todas las direcciones del usuario."""
        stmt = select(DireccionEnvio).where(
            and_(
                DireccionEnvio.id_usuario == user_id,
                DireccionEnvio.es_principal.is_(True),
            )
        )
        result = await self.db.execute(stmt)
        for d in result.scalars().all():
            d.es_principal = False
        await self.db.flush()
