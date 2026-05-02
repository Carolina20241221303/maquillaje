"""Router de Direcciones de Envío."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user
from app.models.usuario import Usuario
from app.schemas.direccion import DireccionCreate, DireccionResponse, DireccionUpdate
from app.services.direccion import DireccionService

router = APIRouter()


@router.get("/", response_model=list[DireccionResponse])
async def list_direcciones(
    current_user: Usuario = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = DireccionService(db)
    return await service.list_by_usuario(current_user.id_usuario)


@router.get("/{dir_id}", response_model=DireccionResponse)
async def get_direccion(
    dir_id: int,
    current_user: Usuario = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = DireccionService(db)
    return await service.get_direccion(dir_id, current_user.id_usuario)


@router.post("/", response_model=DireccionResponse)
async def create_direccion(
    data: DireccionCreate,
    current_user: Usuario = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = DireccionService(db)
    return await service.create(current_user.id_usuario, data)


@router.put("/{dir_id}", response_model=DireccionResponse)
async def update_direccion(
    dir_id: int,
    data: DireccionUpdate,
    current_user: Usuario = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = DireccionService(db)
    return await service.update(dir_id, current_user.id_usuario, data)


@router.delete("/{dir_id}")
async def deactivate_direccion(
    dir_id: int,
    current_user: Usuario = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = DireccionService(db)
    await service.deactivate(dir_id, current_user.id_usuario)
    return {"message": "Dirección desactivada"}