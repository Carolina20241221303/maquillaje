"""Router de Inventario."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.inventario import (
    InventarioCreate,
    InventarioResponse,
    InventarioUpdate,
    LoteCreate,
    LoteResponse,
    MovimientoCreate,
    MovimientoResponse,
    TipoMovimientoResponse,
)
from app.services.inventario import InventarioService
from app.dependencies import require_roles

router = APIRouter()


# ── Lotes ──
@router.get("/lotes", response_model=list[LoteResponse])
async def list_lotes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = InventarioService(db)
    return await service.list_lotes(skip=skip, limit=limit)


@router.get("/lotes/{lote_id}", response_model=LoteResponse)
async def get_lote(
    lote_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = InventarioService(db)
    return await service.get_lote(lote_id)


@router.post("/lotes", response_model=LoteResponse)
async def create_lote(
    data: LoteCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = InventarioService(db)
    return await service.create_lote(data)


# ── Inventario ──
@router.get("/inventario", response_model=list[InventarioResponse])
async def list_inventario(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = InventarioService(db)
    return await service.list_inventario(skip=skip, limit=limit)


@router.get("/inventario/{prod_id}", response_model=InventarioResponse)
async def get_inventario(
    prod_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = InventarioService(db)
    return await service.get_inventario(prod_id)


@router.post("/inventario", response_model=InventarioResponse)
async def create_inventario(
    data: InventarioCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = InventarioService(db)
    return await service.create_inventario(data)


@router.put("/inventario/{prod_id}", response_model=InventarioResponse)
async def update_inventario(
    prod_id: int,
    data: InventarioUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = InventarioService(db)
    return await service.update_inventario(prod_id, data)


# ── Tipos de Movimiento ──
@router.get("/tipos-movimiento", response_model=list[TipoMovimientoResponse])
async def list_tipos_movimiento(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = InventarioService(db)
    return await service.list_tipos_movimiento()


# ── Movimientos ──
@router.get("/movimientos", response_model=list[MovimientoResponse])
async def list_movimientos(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = InventarioService(db)
    return await service.list_movimientos(skip=skip, limit=limit)


@router.post("/movimientos", response_model=MovimientoResponse)
async def create_movimiento(
    data: MovimientoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = InventarioService(db)
    return await service.create_movimiento(data)