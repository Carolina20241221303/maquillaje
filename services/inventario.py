"""Servicio de Inventario: Lotes, Stock, Movimientos."""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventario import Inventario, Lote, MovimientoInventario
from app.repositories.inventario import (
    InventarioRepository,
    LoteRepository,
    MovimientoInventarioRepository,
    TipoMovimientoRepository,
)
from app.schemas.inventario import InventarioCreate, InventarioUpdate, LoteCreate, MovimientoCreate


class InventarioService:

    def __init__(self, db: AsyncSession) -> None:
        self.lote_repo = LoteRepository(db)
        self.inv_repo = InventarioRepository(db)
        self.tipo_repo = TipoMovimientoRepository(db)
        self.mov_repo = MovimientoInventarioRepository(db)

    # ── Lotes ──
    async def list_lotes(self, *, skip: int = 0, limit: int = 50) -> list[Lote]:
        return await self.lote_repo.list_all(skip=skip, limit=limit)

    async def get_lote(self, lote_id: int) -> Lote:
        lote = await self.lote_repo.get_by_id(lote_id)
        if not lote:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Lote no encontrado")
        return lote

    async def create_lote(self, data: LoteCreate) -> Lote:
        lote = Lote(**data.model_dump())
        lote = await self.lote_repo.create(lote)

        # Crear o actualizar inventario consolidado
        inv = await self.inv_repo.get_by_producto(data.id_producto)
        if inv:
            await self.inv_repo.update_stock(inv, data.cantidad_inicial)
        else:
            inv = Inventario(id_producto=data.id_producto, stock_actual=data.cantidad_inicial)
            await self.inv_repo.create(inv)

        # Registrar movimiento de entrada
        tipo_entrada = await self.tipo_repo.get_by_nombre("entrada")
        if tipo_entrada:
            mov = MovimientoInventario(
                id_lote=lote.id_lote,
                id_tipo_movimiento=tipo_entrada.id_tipo_movimiento,
                cantidad=data.cantidad_inicial,
                motivo="Ingreso de lote nuevo",
            )
            await self.mov_repo.create(mov)

        return lote

    # ── Inventario ──
    async def list_inventario(self, *, skip: int = 0, limit: int = 50) -> list[Inventario]:
        return await self.inv_repo.list_all(skip=skip, limit=limit)

    async def get_inventario(self, prod_id: int) -> Inventario:
        inv = await self.inv_repo.get_by_producto(prod_id)
        if not inv:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Inventario no encontrado para este producto")
        return inv

    async def create_inventario(self, data: InventarioCreate) -> Inventario:
        existing = await self.inv_repo.get_by_producto(data.id_producto)
        if existing:
            raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe registro de inventario para este producto")
        inv = Inventario(**data.model_dump())
        return await self.inv_repo.create(inv)

    async def update_inventario(self, prod_id: int, data: InventarioUpdate) -> Inventario:
        inv = await self.get_inventario(prod_id)
        return await self.inv_repo.update(inv, data.model_dump(exclude_unset=True))

    # ── Tipos de Movimiento ──
    async def list_tipos_movimiento(self):
        return await self.tipo_repo.list_all()

    # ── Movimientos ──
    async def list_movimientos(self, *, skip: int = 0, limit: int = 50):
        return await self.mov_repo.list_all(skip=skip, limit=limit)

    async def create_movimiento(self, data: MovimientoCreate) -> MovimientoInventario:
        # Validar lote y tipo
        lote = await self.get_lote(data.id_lote)
        tipo = await self.tipo_repo.get_by_id(data.id_tipo_movimiento)
        if not tipo:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Tipo de movimiento no encontrado")

        # Actualizar stock consolidado
        inv = await self.inv_repo.get_by_producto(lote.id_producto)
        if not inv:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "No existe inventario para este producto")

        delta = data.cantidad if tipo.afecta_stock else -data.cantidad
        try:
            await self.inv_repo.update_stock(inv, delta)
        except ValueError:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Stock insuficiente para este movimiento")

        mov = MovimientoInventario(**data.model_dump())
        return await self.mov_repo.create(mov)
