"""Servicio de Catálogo: Categorías, Marcas, Unidades, Productos, Precios."""

from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalogo import Categoria, Marca, PrecioProducto, Producto, ProductoVariante, UnidadMedida
from app.repositories.catalogo import (
    CategoriaRepository,
    MarcaRepository,
    PrecioProductoRepository,
    ProductoRepository,
    ProductoVarianteRepository,
    UnidadMedidaRepository,
)
from app.repositories.inventario import InventarioRepository
from app.schemas.catalogo import (
    CategoriaCreate,
    CategoriaUpdate,
    MarcaCreate,
    MarcaUpdate,
    PrecioCreate,
    ProductoCreate,
    ProductoDetalleResponse,
    ProductoVarianteCreate,
    ProductoVarianteResponse,
    ProductoVarianteUpdate,
    ProductoUpdate,
    UnidadMedidaCreate,
    UnidadMedidaUpdate,
)


class CatalogoService:

    def __init__(self, db: AsyncSession) -> None:
        self.cat_repo = CategoriaRepository(db)
        self.marca_repo = MarcaRepository(db)
        self.unidad_repo = UnidadMedidaRepository(db)
        self.prod_repo = ProductoRepository(db)
        self.var_repo = ProductoVarianteRepository(db)
        self.precio_repo = PrecioProductoRepository(db)
        self.inv_repo = InventarioRepository(db)

    def _build_variantes(self, prod: Producto) -> list[ProductoVarianteResponse]:
        variantes = [
            ProductoVarianteResponse(
                id_variante=v.id_variante,
                id_producto=v.id_producto,
                nombre_variante=v.nombre_variante,
                color_hex=v.color_hex,
                orden=v.orden,
                activo=v.activo,
            )
            for v in sorted(prod.variantes or [], key=lambda item: (item.orden, item.id_variante))
            if v.activo
        ]
        if variantes:
            return variantes
        variante_valor = (prod.variante_valor or prod.tono or "").strip()
        if not variante_valor:
            return []
        return [
            ProductoVarianteResponse(
                id_variante=None,
                id_producto=prod.id_producto,
                nombre_variante=variante_valor,
                color_hex=prod.variante_color_hex,
                orden=1,
                activo=True,
            )
        ]

    # ── Categorías ──
    async def list_categorias(self) -> list[Categoria]:
        return await self.cat_repo.list_all()

    async def get_categoria(self, cat_id: int) -> Categoria:
        cat = await self.cat_repo.get_by_id(cat_id)
        if not cat:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Categoría no encontrada")
        return cat

    async def create_categoria(self, data: CategoriaCreate) -> Categoria:
        cat = Categoria(**data.model_dump())
        return await self.cat_repo.create(cat)

    async def update_categoria(self, cat_id: int, data: CategoriaUpdate) -> Categoria:
        cat = await self.get_categoria(cat_id)
        return await self.cat_repo.update(cat, data.model_dump(exclude_unset=True))

    async def delete_categoria(self, cat_id: int) -> None:
        cat = await self.get_categoria(cat_id)
        total = await self.prod_repo.count_by_categoria(cat_id)
        if total > 0:
            activos = await self.prod_repo.count_by_categoria(cat_id, only_active=True)
            inactivos = total - activos
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                (
                    "No se puede eliminar la categoría porque tiene productos asociados. "
                    f"Total: {total} (activos: {activos}, inactivos: {inactivos})."
                ),
            )
        await self.cat_repo.delete(cat)

    # ── Marcas ──
    async def list_marcas(self) -> list[Marca]:
        return await self.marca_repo.list_all()

    async def get_marca(self, marca_id: int) -> Marca:
        marca = await self.marca_repo.get_by_id(marca_id)
        if not marca:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Marca no encontrada")
        return marca

    async def create_marca(self, data: MarcaCreate) -> Marca:
        marca = Marca(**data.model_dump())
        return await self.marca_repo.create(marca)

    async def update_marca(self, marca_id: int, data: MarcaUpdate) -> Marca:
        marca = await self.get_marca(marca_id)
        return await self.marca_repo.update(marca, data.model_dump(exclude_unset=True))

    async def delete_marca(self, marca_id: int) -> None:
        marca = await self.get_marca(marca_id)
        total = await self.prod_repo.count_by_marca(marca_id)
        if total > 0:
            activos = await self.prod_repo.count_by_marca(marca_id, only_active=True)
            inactivos = total - activos
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                (
                    "No se puede eliminar la marca porque tiene productos asociados. "
                    f"Total: {total} (activos: {activos}, inactivos: {inactivos})."
                ),
            )
        await self.marca_repo.delete(marca)

    # ── Unidades de Medida ──
    async def list_unidades(self) -> list[UnidadMedida]:
        return await self.unidad_repo.list_all()

    async def get_unidad(self, unidad_id: int) -> UnidadMedida:
        unidad = await self.unidad_repo.get_by_id(unidad_id)
        if not unidad:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Unidad de medida no encontrada")
        return unidad

    async def create_unidad(self, data: UnidadMedidaCreate) -> UnidadMedida:
        unidad = UnidadMedida(**data.model_dump())
        return await self.unidad_repo.create(unidad)

    async def update_unidad(self, unidad_id: int, data: UnidadMedidaUpdate) -> UnidadMedida:
        unidad = await self.get_unidad(unidad_id)
        return await self.unidad_repo.update(unidad, data.model_dump(exclude_unset=True))

    async def delete_unidad(self, unidad_id: int) -> None:
        unidad = await self.get_unidad(unidad_id)
        await self.unidad_repo.delete(unidad)

    # ── Productos ──
    async def list_productos(
        self,
        *,
        skip: int = 0,
        limit: int = 50,
        activo: bool | None = True,
        id_categoria: int | None = None,
        id_marca: int | None = None,
        search: str | None = None,
    ) -> list[ProductoDetalleResponse]:
        productos = await self.prod_repo.list_all(
            skip=skip,
            limit=limit,
            activo=activo,
            id_categoria=id_categoria,
            id_marca=id_marca,
            search=search,
        )
        result = []
        for p in productos:
            precio = await self.precio_repo.get_precio_vigente(p.id_producto)
            precio_venta = precio.precio_venta if precio else None
            iva = p.categoria.porcentaje_iva if p.categoria else Decimal("0")
            precio_con_iva = (
                round(precio_venta * (1 + iva / 100), 2) if precio_venta else None
            )
            inventario = await self.inv_repo.get_by_producto(p.id_producto)
            stock_actual = inventario.stock_actual if inventario else 0
            variante_valor = p.variante_valor or p.tono
            variante_tipo = p.variante_tipo or ("Tono" if variante_valor else None)
            result.append(
                ProductoDetalleResponse(
                    id_producto=p.id_producto,
                    codigo_barras=p.codigo_barras,
                    nombre_producto=p.nombre_producto,
                    descripcion=p.descripcion,
                    tono=p.tono or variante_valor,
                    variante_tipo=variante_tipo,
                    variante_valor=variante_valor,
                    variante_color_hex=p.variante_color_hex,
                    id_categoria=p.id_categoria,
                    id_marca=p.id_marca,
                    contenido_neto=p.contenido_neto,
                    id_unidad_medida=p.id_unidad_medida,
                    imagen_url=p.imagen_url,
                    activo=p.activo,
                    nombre_categoria=p.categoria.nombre_categoria if p.categoria else None,
                    nombre_marca=p.marca.nombre_marca if p.marca else None,
                    precio_venta=precio_venta,
                    precio_con_iva=precio_con_iva,
                    porcentaje_iva=iva,
                    stock_actual=stock_actual,
                    variantes=self._build_variantes(p),
                )
            )
        return result

    async def get_producto(self, prod_id: int) -> Producto:
        prod = await self.prod_repo.get_by_id(prod_id)
        if not prod:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado")
        return prod

    async def get_producto_detalle(self, prod_id: int) -> ProductoDetalleResponse:
        p = await self.get_producto(prod_id)
        precio = await self.precio_repo.get_precio_vigente(p.id_producto)
        precio_venta = precio.precio_venta if precio else None
        iva = p.categoria.porcentaje_iva if p.categoria else Decimal("0")
        precio_con_iva = (
            round(precio_venta * (1 + iva / 100), 2) if precio_venta else None
        )
        inventario = await self.inv_repo.get_by_producto(p.id_producto)
        stock_actual = inventario.stock_actual if inventario else 0
        variante_valor = p.variante_valor or p.tono
        variante_tipo = p.variante_tipo or ("Tono" if variante_valor else None)
        return ProductoDetalleResponse(
            id_producto=p.id_producto,
            codigo_barras=p.codigo_barras,
            nombre_producto=p.nombre_producto,
            descripcion=p.descripcion,
            tono=p.tono or variante_valor,
            variante_tipo=variante_tipo,
            variante_valor=variante_valor,
            variante_color_hex=p.variante_color_hex,
            id_categoria=p.id_categoria,
            id_marca=p.id_marca,
            contenido_neto=p.contenido_neto,
            id_unidad_medida=p.id_unidad_medida,
            imagen_url=p.imagen_url,
            activo=p.activo,
            nombre_categoria=p.categoria.nombre_categoria if p.categoria else None,
            nombre_marca=p.marca.nombre_marca if p.marca else None,
            precio_venta=precio_venta,
            precio_con_iva=precio_con_iva,
            porcentaje_iva=iva,
            stock_actual=stock_actual,
            variantes=self._build_variantes(p),
        )

    async def create_producto(self, data: ProductoCreate) -> Producto:
        await self.get_categoria(data.id_categoria)
        await self.get_marca(data.id_marca)
        if data.id_unidad_medida:
            await self.get_unidad(data.id_unidad_medida)
        payload = data.model_dump()
        if payload.get("variante_valor") and not payload.get("variante_tipo"):
            payload["variante_tipo"] = "Tono"
        if payload.get("variante_valor") and not payload.get("tono"):
            payload["tono"] = payload["variante_valor"]
        if payload.get("variante_color_hex"):
            payload["variante_color_hex"] = payload["variante_color_hex"].upper()
        prod = Producto(**payload)
        created = await self.prod_repo.create(prod)
        if payload.get("variante_valor"):
            await self.var_repo.create(
                ProductoVariante(
                    id_producto=created.id_producto,
                    nombre_variante=payload["variante_valor"],
                    color_hex=payload.get("variante_color_hex"),
                    orden=1,
                    activo=True,
                )
            )
        return created

    async def update_producto(self, prod_id: int, data: ProductoUpdate) -> Producto:
        prod = await self.get_producto(prod_id)
        update_data = data.model_dump(exclude_unset=True)
        if "id_categoria" in update_data:
            await self.get_categoria(update_data["id_categoria"])
        if "id_marca" in update_data:
            await self.get_marca(update_data["id_marca"])
        if "id_unidad_medida" in update_data and update_data["id_unidad_medida"]:
            await self.get_unidad(update_data["id_unidad_medida"])
        if "variante_valor" in update_data and update_data["variante_valor"] and not update_data.get("variante_tipo"):
            update_data["variante_tipo"] = "Tono"
        if "variante_valor" in update_data and update_data["variante_valor"] and not update_data.get("tono"):
            update_data["tono"] = update_data["variante_valor"]
        if "variante_color_hex" in update_data and update_data["variante_color_hex"]:
            update_data["variante_color_hex"] = update_data["variante_color_hex"].upper()
        return await self.prod_repo.update(prod, update_data)

    async def delete_producto(self, prod_id: int) -> Producto:
        prod = await self.get_producto(prod_id)
        # Primera eliminación: lógica (activo -> inactivo)
        if prod.activo:
            return await self.prod_repo.update(prod, {"activo": False})

        # Si ya está inactivo, eliminar físicamente con purga de dependencias.
        try:
            await self.prod_repo.purge_operational_dependencies(prod_id)
            await self.prod_repo.delete(prod)
            return prod
        except IntegrityError:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                (
                    "No se pudo eliminar físicamente el producto por referencias relacionadas."
                ),
            )
        except SQLAlchemyError:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                (
                    "No se pudo eliminar físicamente el producto por una referencia de base de datos."
                ),
            )

    # ── Precios ──
    async def list_precios(self, prod_id: int) -> list[PrecioProducto]:
        await self.get_producto(prod_id)
        return await self.precio_repo.list_by_producto(prod_id)

    async def create_precio(self, data: PrecioCreate) -> PrecioProducto:
        await self.get_producto(data.id_producto)
        precio_existente = await self.precio_repo.get_precio_vigente(data.id_producto)
        if precio_existente:
            precio_existente.precio_venta = data.precio_venta
            await self.precio_repo.db.flush()
            return precio_existente
        else:
            precio = PrecioProducto(
                id_producto=data.id_producto,
                precio_venta=data.precio_venta,
                fecha_inicio=data.fecha_inicio or date.today(),
            )
            return await self.precio_repo.create(precio)

    async def list_variantes(self, prod_id: int) -> list[ProductoVarianteResponse]:
        await self.get_producto(prod_id)
        variantes = await self.var_repo.list_by_producto(prod_id, only_active=True)
        return [
            ProductoVarianteResponse(
                id_variante=v.id_variante,
                id_producto=v.id_producto,
                nombre_variante=v.nombre_variante,
                color_hex=v.color_hex,
                orden=v.orden,
                activo=v.activo,
            )
            for v in variantes
        ]

    async def create_variante(self, prod_id: int, data: ProductoVarianteCreate) -> ProductoVariante:
        await self.get_producto(prod_id)
        payload = data.model_dump()
        if payload.get("color_hex"):
            payload["color_hex"] = payload["color_hex"].upper()
        variante = ProductoVariante(
            id_producto=prod_id,
            nombre_variante=payload["nombre_variante"],
            color_hex=payload.get("color_hex"),
            orden=payload.get("orden", 1),
            activo=payload.get("activo", True),
        )
        return await self.var_repo.create(variante)

    async def update_variante(self, prod_id: int, var_id: int, data: ProductoVarianteUpdate) -> ProductoVariante:
        await self.get_producto(prod_id)
        variante = await self.var_repo.get_by_producto_and_id(prod_id, var_id)
        if not variante:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Variante no encontrada")
        update_data = data.model_dump(exclude_unset=True)
        if "color_hex" in update_data and update_data["color_hex"]:
            update_data["color_hex"] = update_data["color_hex"].upper()
        return await self.var_repo.update(variante, update_data)

    async def delete_variante(self, prod_id: int, var_id: int) -> ProductoVariante:
        await self.get_producto(prod_id)
        variante = await self.var_repo.get_by_producto_and_id(prod_id, var_id)
        if not variante:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Variante no encontrada")
        return await self.var_repo.update(variante, {"activo": False})
