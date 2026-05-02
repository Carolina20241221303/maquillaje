"""Servicio de Geografía."""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.geografia import Ciudad, Departamento
from app.repositories.geografia import CiudadRepository, DepartamentoRepository
from app.schemas.geografia import CiudadCreate, CiudadUpdate, DepartamentoCreate, DepartamentoUpdate


class GeografiaService:

    def __init__(self, db: AsyncSession) -> None:
        self.dep_repo = DepartamentoRepository(db)
        self.city_repo = CiudadRepository(db)

    # ── Departamentos ──
    async def list_departamentos(self) -> list[Departamento]:
        return await self.dep_repo.list_all()

    async def get_departamento(self, dep_id: int) -> Departamento:
        dep = await self.dep_repo.get_by_id(dep_id)
        if not dep:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Departamento no encontrado")
        return dep

    async def create_departamento(self, data: DepartamentoCreate) -> Departamento:
        dep = Departamento(nombre_departamento=data.nombre_departamento)
        return await self.dep_repo.create(dep)

    async def update_departamento(self, dep_id: int, data: DepartamentoUpdate) -> Departamento:
        dep = await self.get_departamento(dep_id)
        return await self.dep_repo.update(dep, data.model_dump(exclude_unset=True))

    async def delete_departamento(self, dep_id: int) -> None:
        dep = await self.get_departamento(dep_id)
        await self.dep_repo.delete(dep)

    # ── Ciudades ──
    async def list_ciudades(self, id_departamento: int | None = None) -> list[Ciudad]:
        return await self.city_repo.list_all(dep_id=id_departamento)

    async def get_ciudad(self, city_id: int) -> Ciudad:
        city = await self.city_repo.get_by_id(city_id)
        if not city:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Ciudad no encontrada")
        return city

    async def create_ciudad(self, data: CiudadCreate) -> Ciudad:
        # Verificar que exista el departamento
        await self.get_departamento(data.id_departamento)
        city = Ciudad(nombre_ciudad=data.nombre_ciudad, id_departamento=data.id_departamento)
        return await self.city_repo.create(city)

    async def update_ciudad(self, city_id: int, data: CiudadUpdate) -> Ciudad:
        city = await self.get_ciudad(city_id)
        if data.id_departamento is not None:
            await self.get_departamento(data.id_departamento)
        return await self.city_repo.update(city, data.model_dump(exclude_unset=True))

    async def delete_ciudad(self, city_id: int) -> None:
        city = await self.get_ciudad(city_id)
        await self.city_repo.delete(city)
