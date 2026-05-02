"""Repositorio de Geografía: Departamento y Ciudad."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.geografia import Ciudad, Departamento


class DepartamentoRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, dep_id: int) -> Departamento | None:
        stmt = select(Departamento).where(Departamento.id_departamento == dep_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Departamento]:
        stmt = select(Departamento).order_by(Departamento.id_departamento)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, dep: Departamento) -> Departamento:
        self.db.add(dep)
        await self.db.flush()
        await self.db.refresh(dep)
        return dep

    async def update(self, dep: Departamento, data: dict) -> Departamento:
        for key, value in data.items():
            if value is not None:
                setattr(dep, key, value)
        await self.db.flush()
        await self.db.refresh(dep)
        return dep

    async def delete(self, dep: Departamento) -> None:
        await self.db.delete(dep)
        await self.db.flush()


class CiudadRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, city_id: int) -> Ciudad | None:
        stmt = (
            select(Ciudad)
            .options(selectinload(Ciudad.departamento))
            .where(Ciudad.id_ciudad == city_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self, dep_id: int | None = None) -> list[Ciudad]:
        stmt = select(Ciudad).options(selectinload(Ciudad.departamento))
        if dep_id is not None:
            stmt = stmt.where(Ciudad.id_departamento == dep_id)
        stmt = stmt.order_by(Ciudad.id_ciudad)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, city: Ciudad) -> Ciudad:
        self.db.add(city)
        await self.db.flush()
        await self.db.refresh(city, attribute_names=["departamento"])
        return city

    async def update(self, city: Ciudad, data: dict) -> Ciudad:
        for key, value in data.items():
            if value is not None:
                setattr(city, key, value)
        await self.db.flush()
        await self.db.refresh(city)
        return city

    async def delete(self, city: Ciudad) -> None:
        await self.db.delete(city)
        await self.db.flush()
