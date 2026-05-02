"""Router de Geografía."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.geografia import CiudadCreate, CiudadResponse, CiudadUpdate, DepartamentoCreate, DepartamentoResponse, DepartamentoUpdate
from app.services.geografia import GeografiaService
from app.dependencies import require_roles

router = APIRouter()


# ── Departamentos ──
@router.get("/departamentos", response_model=list[DepartamentoResponse])
async def list_departamentos(
    db: AsyncSession = Depends(get_db),
):
    service = GeografiaService(db)
    return await service.list_departamentos()


@router.get("/departamentos/{dep_id}", response_model=DepartamentoResponse)
async def get_departamento(
    dep_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = GeografiaService(db)
    return await service.get_departamento(dep_id)


@router.post("/departamentos", response_model=DepartamentoResponse)
async def create_departamento(
    data: DepartamentoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = GeografiaService(db)
    return await service.create_departamento(data)


@router.put("/departamentos/{dep_id}", response_model=DepartamentoResponse)
async def update_departamento(
    dep_id: int,
    data: DepartamentoUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = GeografiaService(db)
    return await service.update_departamento(dep_id, data)


@router.delete("/departamentos/{dep_id}")
async def delete_departamento(
    dep_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = GeografiaService(db)
    await service.delete_departamento(dep_id)
    return {"message": "Departamento eliminado"}


# ── Ciudades ──
@router.get("/ciudades", response_model=list[CiudadResponse])
async def list_ciudades(
    id_departamento: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = GeografiaService(db)
    return await service.list_ciudades(id_departamento)


@router.get("/ciudades/{city_id}", response_model=CiudadResponse)
async def get_ciudad(
    city_id: int,
    db: AsyncSession = Depends(get_db),
):
    service = GeografiaService(db)
    return await service.get_ciudad(city_id)


@router.post("/ciudades", response_model=CiudadResponse)
async def create_ciudad(
    data: CiudadCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = GeografiaService(db)
    return await service.create_ciudad(data)


@router.put("/ciudades/{city_id}", response_model=CiudadResponse)
async def update_ciudad(
    city_id: int,
    data: CiudadUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = GeografiaService(db)
    return await service.update_ciudad(city_id, data)


@router.delete("/ciudades/{city_id}")
async def delete_ciudad(
    city_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = GeografiaService(db)
    await service.delete_ciudad(city_id)
    return {"message": "Ciudad eliminada"}