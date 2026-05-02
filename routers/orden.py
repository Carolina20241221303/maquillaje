"""Router de Órdenes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user, require_roles
from app.models.usuario import Usuario
from app.schemas.orden import OrdenCreate, OrdenResponse, OrdenUpdateEstado, orden_to_dict
from app.services.orden import OrdenService

router = APIRouter()


@router.post("/", response_model=OrdenResponse)
async def create_orden(
    data: OrdenCreate,
    current_user: Usuario = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrdenService(db)
    orden = await service.create_orden(current_user.id_usuario, data)
    return OrdenResponse(**orden_to_dict(orden))


@router.get("/", response_model=list[OrdenResponse])
async def list_ordenes(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    estado: str | None = Query(None),
    current_user: Usuario = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrdenService(db)
    if current_user.rol.nombre_rol == "cliente":
        ordenes = await service.list_ordenes_usuario(current_user.id_usuario, skip=skip, limit=limit)
    else:
        ordenes = await service.list_all_ordenes(skip=skip, limit=limit, estado=estado)
    return [OrdenResponse(**orden_to_dict(o)) for o in ordenes]


@router.get("/{orden_id}", response_model=OrdenResponse)
async def get_orden(
    orden_id: int,
    current_user: Usuario = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrdenService(db)
    user_id = current_user.id_usuario if current_user.rol.nombre_rol == "cliente" else None
    orden = await service.get_orden(orden_id, user_id)
    return OrdenResponse(**orden_to_dict(orden))


@router.put("/{orden_id}/estado", response_model=OrdenResponse)
async def update_estado_orden(
    orden_id: int,
    data: OrdenUpdateEstado,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = OrdenService(db)
    orden = await service.update_estado(orden_id, data)
    return OrdenResponse(**orden_to_dict(orden))