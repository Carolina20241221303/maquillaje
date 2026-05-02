"""Router de Pagos."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_active_user, require_roles
from app.models.usuario import Usuario
from app.schemas.pago import PagoCreate, PagoResponse, PagoUpdateEstado
from app.services.pago import PagoService

router = APIRouter()


@router.post("/", response_model=PagoResponse)
async def create_pago(
    data: PagoCreate,
    current_user: Usuario = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = PagoService(db)
    return await service.create_pago(data, current_user.id_usuario)


@router.get("/{pago_id}", response_model=PagoResponse)
async def get_pago(
    pago_id: int,
    current_user: Usuario = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = PagoService(db)
    pago = await service.get_pago(pago_id)
    # Verificar que la orden pertenece al usuario si es cliente
    if current_user.rol.nombre_rol == "cliente":
        orden = await service.orden_repo.get_by_id(pago.id_orden)
        if orden and orden.id_usuario != current_user.id_usuario:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene acceso a este pago")
    return pago


@router.get("/ordenes/{orden_id}/pago", response_model=PagoResponse)
async def get_pago_by_orden(
    orden_id: int,
    current_user: Usuario = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    service = PagoService(db)
    pago = await service.get_pago_by_orden(orden_id)
    # Verificar acceso
    if current_user.rol.nombre_rol == "cliente":
        orden = await service.orden_repo.get_by_id(orden_id)
        if orden and orden.id_usuario != current_user.id_usuario:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene acceso a este pago")
    return pago


@router.put("/{pago_id}/estado", response_model=PagoResponse)
async def update_estado_pago(
    pago_id: int,
    data: PagoUpdateEstado,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = PagoService(db)
    return await service.update_estado(pago_id, data)