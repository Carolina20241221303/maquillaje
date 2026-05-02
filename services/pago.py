"""Servicio de Pago simulado."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pago import Pago
from app.repositories.orden import OrdenRepository
from app.repositories.pago import PagoRepository
from app.schemas.pago import PagoCreate, PagoUpdateEstado


class PagoService:

    def __init__(self, db: AsyncSession) -> None:
        self.pago_repo = PagoRepository(db)
        self.orden_repo = OrdenRepository(db)

    async def create_pago(self, data: PagoCreate, user_id: int) -> Pago:
        # Validar que la orden existe y pertenece al usuario
        orden = await self.orden_repo.get_by_id(data.id_orden)
        if not orden:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada")
        if orden.id_usuario != user_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene acceso a esta orden")

        # Verificar que no tenga pago previo
        existing = await self.pago_repo.get_by_orden(data.id_orden)
        if existing:
            raise HTTPException(status.HTTP_409_CONFLICT, "La orden ya tiene un pago registrado")

        # Verificar que la orden esté pendiente
        if orden.estado != "pendiente":
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"No se puede pagar una orden en estado '{orden.estado}'",
            )

        pago = Pago(
            id_orden=data.id_orden,
            metodo_pago=data.metodo_pago,
            ultimos4=data.ultimos4,
            nombre_titular=data.nombre_titular,
            monto=orden.total,
            referencia_simulada=str(uuid.uuid4()),
        )
        return await self.pago_repo.create(pago)

    async def get_pago(self, pago_id: int) -> Pago:
        pago = await self.pago_repo.get_by_id(pago_id)
        if not pago:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Pago no encontrado")
        return pago

    async def get_pago_by_orden(self, orden_id: int) -> Pago:
        pago = await self.pago_repo.get_by_orden(orden_id)
        if not pago:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Pago no encontrado para esta orden")
        return pago

    async def update_estado(self, pago_id: int, data: PagoUpdateEstado) -> Pago:
        pago = await self.get_pago(pago_id)

        valid_transitions = {
            "pendiente": ["aprobado", "rechazado"],
            "aprobado": [],
            "rechazado": [],
        }
        if data.estado_pago not in valid_transitions.get(pago.estado_pago, []):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"No se puede cambiar de '{pago.estado_pago}' a '{data.estado_pago}'",
            )

        pago = await self.pago_repo.update_estado(pago, data.estado_pago)

        # Si el pago es aprobado, pasar la orden a 'procesando'
        if data.estado_pago == "aprobado":
            orden = await self.orden_repo.get_by_id(pago.id_orden)
            if orden and orden.estado == "pendiente":
                await self.orden_repo.update_estado(orden, "procesando")

        return pago
