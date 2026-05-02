"""Servicio de Direcciones de Envío."""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.direccion import DireccionEnvio
from app.repositories.direccion import DireccionRepository
from app.schemas.direccion import DireccionCreate, DireccionUpdate


class DireccionService:

    def __init__(self, db: AsyncSession) -> None:
        self.dir_repo = DireccionRepository(db)

    @staticmethod
    def _to_response(d: DireccionEnvio) -> dict:
        return {
            "id_direccion": d.id_direccion,
            "id_usuario": d.id_usuario,
            "nombre_destinatario": d.nombre_destinatario,
            "telefono": d.telefono,
            "direccion": d.direccion,
            "id_ciudad": d.id_ciudad,
            "codigo_postal": d.codigo_postal,
            "es_principal": d.es_principal,
            "activa": d.activa,
            "ciudad": d.ciudad.nombre_ciudad if d.ciudad else None,
            "departamento": d.ciudad.departamento.nombre_departamento if d.ciudad and d.ciudad.departamento else None,
        }

    async def _get_owned_direccion(self, dir_id: int, user_id: int) -> DireccionEnvio:
        d = await self.dir_repo.get_by_id(dir_id)
        if not d or d.id_usuario != user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Dirección no encontrada")
        return d

    async def list_by_usuario(self, user_id: int) -> list[dict]:
        direcciones = await self.dir_repo.list_by_usuario(user_id)
        return [self._to_response(d) for d in direcciones]

    async def get_direccion(self, dir_id: int, user_id: int) -> dict:
        d = await self._get_owned_direccion(dir_id, user_id)
        return self._to_response(d)

    async def create(self, user_id: int, data: DireccionCreate) -> dict:
        if data.es_principal:
            await self.dir_repo.unset_principal(user_id)
        direccion = DireccionEnvio(id_usuario=user_id, **data.model_dump())
        created = await self.dir_repo.create(direccion)
        reloaded = await self.dir_repo.get_by_id(created.id_direccion)
        return self._to_response(reloaded or created)

    async def update(self, dir_id: int, user_id: int, data: DireccionUpdate) -> dict:
        d = await self._get_owned_direccion(dir_id, user_id)
        update_data = data.model_dump(exclude_unset=True)
        if update_data.get("es_principal"):
            await self.dir_repo.unset_principal(user_id)
        updated = await self.dir_repo.update(d, update_data)
        reloaded = await self.dir_repo.get_by_id(updated.id_direccion)
        return self._to_response(reloaded or updated)

    async def deactivate(self, dir_id: int, user_id: int) -> DireccionEnvio:
        d = await self._get_owned_direccion(dir_id, user_id)
        return await self.dir_repo.update(d, {"activa": False, "es_principal": False})
