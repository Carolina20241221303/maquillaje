"""Repositorio de Catálogo: Categoria, Marca, UnidadMedida, Producto, ProductoVariante, PrecioProducto."""

from datetime import date

from sqlalchemy import select, and_, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.catalogo import (
    Categoria,
    Marca,
    PrecioProducto,
    Producto,
    ProductoVariante,
    UnidadMedida,
)


class CategoriaRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, cat_id: int) -> Categoria | None:
        stmt = select(Categoria).where(Categoria.id_categoria == cat_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Categoria]:
        stmt = select(Categoria).order_by(Categoria.id_categoria)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, cat: Categoria) -> Categoria:
        self.db.add(cat)
        await self.db.flush()
        await self.db.refresh(cat)
        return cat

    async def update(self, cat: Categoria, data: dict) -> Categoria:
        for key, value in data.items():
            if value is not None:
                setattr(cat, key, value)
        await self.db.flush()
        await self.db.refresh(cat)
        return cat

    async def delete(self, cat: Categoria) -> None:
        await self.db.delete(cat)
        await self.db.flush()


class MarcaRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, marca_id: int) -> Marca | None:
        stmt = select(Marca).where(Marca.id_marca == marca_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Marca]:
        stmt = select(Marca).order_by(Marca.id_marca)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, marca: Marca) -> Marca:
        self.db.add(marca)
        await self.db.flush()
        await self.db.refresh(marca)
        return marca

    async def update(self, marca: Marca, data: dict) -> Marca:
        for key, value in data.items():
            if value is not None:
                setattr(marca, key, value)
        await self.db.flush()
        await self.db.refresh(marca)
        return marca

    async def delete(self, marca: Marca) -> None:
        await self.db.delete(marca)
        await self.db.flush()


class UnidadMedidaRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, unidad_id: int) -> UnidadMedida | None:
        stmt = select(UnidadMedida).where(UnidadMedida.id_unidad_medida == unidad_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self) -> list[UnidadMedida]:
        stmt = select(UnidadMedida).order_by(UnidadMedida.id_unidad_medida)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, unidad: UnidadMedida) -> UnidadMedida:
        self.db.add(unidad)
        await self.db.flush()
        await self.db.refresh(unidad)
        return unidad

    async def update(self, unidad: UnidadMedida, data: dict) -> UnidadMedida:
        for key, value in data.items():
            if value is not None:
                setattr(unidad, key, value)
        await self.db.flush()
        await self.db.refresh(unidad)
        return unidad

    async def delete(self, unidad: UnidadMedida) -> None:
        await self.db.delete(unidad)
        await self.db.flush()


class ProductoRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, prod_id: int) -> Producto | None:
        stmt = (
            select(Producto)
            .options(
                selectinload(Producto.categoria),
                selectinload(Producto.marca),
                selectinload(Producto.unidad_medida),
                selectinload(Producto.variantes),
            )
            .where(Producto.id_producto == prod_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        activo: bool | None = True,
        id_categoria: int | None = None,
        id_marca: int | None = None,
        search: str | None = None,
    ) -> list[Producto]:
        stmt = select(Producto).options(
            selectinload(Producto.categoria),
            selectinload(Producto.marca),
            selectinload(Producto.variantes),
        )
        if activo is not None:
            stmt = stmt.where(Producto.activo == activo)
        if id_categoria is not None:
            stmt = stmt.where(Producto.id_categoria == id_categoria)
        if id_marca is not None:
            stmt = stmt.where(Producto.id_marca == id_marca)
        if search:
            stmt = stmt.where(Producto.nombre_producto.ilike(f"%{search}%"))
        stmt = stmt.offset(skip).limit(limit).order_by(Producto.id_producto)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, prod: Producto) -> Producto:
        self.db.add(prod)
        await self.db.flush()
        await self.db.refresh(prod, attribute_names=["categoria", "marca", "unidad_medida"])
        return prod

    async def update(self, prod: Producto, data: dict) -> Producto:
        for key, value in data.items():
            if value is not None:
                setattr(prod, key, value)
        await self.db.flush()
        await self.db.refresh(prod)
        return prod

    async def delete(self, prod: Producto) -> None:
        await self.db.delete(prod)
        await self.db.flush()

    async def has_order_details(self, prod_id: int) -> bool:
        stmt = text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM tienda.detalle_orden
                WHERE id_producto = :prod_id
            )
            """
        )
        result = await self.db.execute(stmt, {"prod_id": prod_id})
        return bool(result.scalar())

    async def purge_operational_dependencies(self, prod_id: int) -> None:
        # Detalles de orden que referencian el producto
        await self.db.execute(
            text("DELETE FROM tienda.detalle_orden WHERE id_producto = :prod_id"),
            {"prod_id": prod_id},
        )
        # Detalles que referencian variantes del producto
        await self.db.execute(
            text(
                """
                DELETE FROM tienda.detalle_orden
                WHERE id_variante IN (
                    SELECT id_variante FROM tienda.producto_variante WHERE id_producto = :prod_id
                )
                """
            ),
            {"prod_id": prod_id},
        )
        # Detalles que referencian lotes del producto
        await self.db.execute(
            text(
                """
                DELETE FROM tienda.detalle_orden
                WHERE id_lote IN (
                    SELECT id_lote FROM tienda.lote WHERE id_producto = :prod_id
                )
                """
            ),
            {"prod_id": prod_id},
        )
        # Movimientos ligados a lotes del producto
        await self.db.execute(
            text(
                """
                DELETE FROM tienda.movimiento_inventario
                WHERE id_lote IN (
                    SELECT id_lote FROM tienda.lote WHERE id_producto = :prod_id
                )
                """
            ),
            {"prod_id": prod_id},
        )
        # Lotes e inventario del producto
        await self.db.execute(text("DELETE FROM tienda.lote WHERE id_producto = :prod_id"), {"prod_id": prod_id})
        await self.db.execute(text("DELETE FROM tienda.inventario WHERE id_producto = :prod_id"), {"prod_id": prod_id})
        # Relación proveedor y precios históricos
        await self.db.execute(text("DELETE FROM tienda.producto_proveedor WHERE id_producto = :prod_id"), {"prod_id": prod_id})
        await self.db.execute(text("DELETE FROM tienda.precio_producto WHERE id_producto = :prod_id"), {"prod_id": prod_id})
        # Variantes del producto (por compatibilidad con esquemas sin ON DELETE CASCADE)
        await self.db.execute(text("DELETE FROM tienda.producto_variante WHERE id_producto = :prod_id"), {"prod_id": prod_id})

    async def count_by_categoria(self, cat_id: int, *, only_active: bool | None = None) -> int:
        stmt = select(func.count(Producto.id_producto)).where(Producto.id_categoria == cat_id)
        if only_active is True:
            stmt = stmt.where(Producto.activo.is_(True))
        elif only_active is False:
            stmt = stmt.where(Producto.activo.is_(False))
        result = await self.db.execute(stmt)
        return int(result.scalar_one() or 0)

    async def count_by_marca(self, marca_id: int, *, only_active: bool | None = None) -> int:
        stmt = select(func.count(Producto.id_producto)).where(Producto.id_marca == marca_id)
        if only_active is True:
            stmt = stmt.where(Producto.activo.is_(True))
        elif only_active is False:
            stmt = stmt.where(Producto.activo.is_(False))
        result = await self.db.execute(stmt)
        return int(result.scalar_one() or 0)

class PrecioProductoRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_precio_vigente(self, prod_id: int) -> PrecioProducto | None:
        """Retorna el precio vigente (fecha_fin IS NULL) de un producto."""
        stmt = (
            select(PrecioProducto)
            .where(
                and_(
                    PrecioProducto.id_producto == prod_id,
                    PrecioProducto.fecha_fin.is_(None),
                )
            )
            .order_by(PrecioProducto.fecha_inicio.desc())
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_producto(self, prod_id: int) -> list[PrecioProducto]:
        stmt = (
            select(PrecioProducto)
            .where(PrecioProducto.id_producto == prod_id)
            .order_by(PrecioProducto.fecha_inicio.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, precio: PrecioProducto) -> PrecioProducto:
        self.db.add(precio)
        await self.db.flush()
        await self.db.refresh(precio)
        return precio

    async def close_current_price(self, prod_id: int) -> None:
        """Cierra el precio vigente actual poniendo fecha_fin = hoy."""
        current = await self.get_precio_vigente(prod_id)
        if current:
            current.fecha_fin = date.today()
            await self.db.flush()


class ProductoVarianteRepository:

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_by_id(self, var_id: int) -> ProductoVariante | None:
        stmt = select(ProductoVariante).where(ProductoVariante.id_variante == var_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_producto_and_id(self, prod_id: int, var_id: int) -> ProductoVariante | None:
        stmt = select(ProductoVariante).where(
            and_(
                ProductoVariante.id_producto == prod_id,
                ProductoVariante.id_variante == var_id,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_producto(self, prod_id: int, *, only_active: bool = True) -> list[ProductoVariante]:
        stmt = select(ProductoVariante).where(ProductoVariante.id_producto == prod_id)
        if only_active:
            stmt = stmt.where(ProductoVariante.activo.is_(True))
        stmt = stmt.order_by(ProductoVariante.orden.asc(), ProductoVariante.id_variante.asc())
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, variante: ProductoVariante) -> ProductoVariante:
        self.db.add(variante)
        await self.db.flush()
        await self.db.refresh(variante)
        return variante

    async def update(self, variante: ProductoVariante, data: dict) -> ProductoVariante:
        for key, value in data.items():
            setattr(variante, key, value)
        await self.db.flush()
        await self.db.refresh(variante)
        return variante
