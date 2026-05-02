"""Servicio de Órdenes — lógica de negocio completa."""

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.inventario import MovimientoInventario
from app.models.orden import DetalleOrden, Orden
from app.repositories.catalogo import PrecioProductoRepository, ProductoRepository, ProductoVarianteRepository
from app.repositories.direccion import DireccionRepository
from app.repositories.inventario import InventarioRepository, LoteRepository, MovimientoInventarioRepository, TipoMovimientoRepository
from app.repositories.orden import OrdenRepository
from app.schemas.orden import OrdenCreate, OrdenUpdateEstado


class OrdenService:

    def __init__(self, db: AsyncSession) -> None:
        self.orden_repo = OrdenRepository(db)
        self.prod_repo = ProductoRepository(db)
        self.var_repo = ProductoVarianteRepository(db)
        self.precio_repo = PrecioProductoRepository(db)
        self.inv_repo = InventarioRepository(db)
        self.lote_repo = LoteRepository(db)
        self.mov_repo = MovimientoInventarioRepository(db)
        self.tipo_repo = TipoMovimientoRepository(db)
        self.dir_repo = DireccionRepository(db)

    async def create_orden(self, user_id: int, data: OrdenCreate) -> Orden:
        # Validar dirección pertenece al usuario
        direccion = await self.dir_repo.get_by_id(data.id_direccion)
        if not direccion or direccion.id_usuario != user_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Dirección no válida")

        # Crear la orden base
        orden = Orden(
            id_usuario=user_id,
            id_direccion=data.id_direccion,
            notas=data.notas,
        )
        orden = await self.orden_repo.create(orden)

        subtotal = Decimal("0")
        iva_total = Decimal("0")

        tipo_venta = await self.tipo_repo.get_by_nombre("venta")

        for item in data.items:
            # Obtener producto y validar
            producto = await self.prod_repo.get_by_id(item.id_producto)
            if not producto or not producto.activo:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"Producto {item.id_producto} no disponible",
                )

            # Obtener precio vigente
            precio = await self.precio_repo.get_precio_vigente(item.id_producto)
            if not precio:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"Producto {item.id_producto} sin precio vigente",
                )

            # Verificar stock
            inv = await self.inv_repo.get_by_producto(item.id_producto)
            if not inv or inv.stock_actual < item.cantidad:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"Stock insuficiente para producto {item.id_producto}",
                )

            # Calcular subtotal de línea
            porcentaje_iva = producto.categoria.porcentaje_iva if producto.categoria else Decimal("0")
            subtotal_linea = precio.precio_venta * item.cantidad
            iva_linea = round(subtotal_linea * porcentaje_iva / 100, 2)

            # Variante opcional (se desnormaliza para preservar histórico)
            id_variante = None
            tipo_variante = None
            nombre_variante = None
            color_hex_variante = None
            if item.id_variante is not None:
                variante = await self.var_repo.get_by_producto_and_id(item.id_producto, item.id_variante)
                if not variante or not variante.activo:
                    raise HTTPException(
                        status.HTTP_400_BAD_REQUEST,
                        f"Variante {item.id_variante} no disponible para producto {item.id_producto}",
                    )
                id_variante = variante.id_variante
                tipo_variante = (producto.variante_tipo or "Variante").strip()
                nombre_variante = variante.nombre_variante
                color_hex_variante = variante.color_hex
            elif producto.variante_valor or producto.tono:
                tipo_variante = (producto.variante_tipo or "Variante").strip()
                nombre_variante = (producto.variante_valor or producto.tono)
                color_hex_variante = producto.variante_color_hex

            # Buscar lote disponible (FIFO por fecha de ingreso)
            lotes = await self.lote_repo.list_by_producto(item.id_producto)
            id_lote = lotes[0].id_lote if lotes else None

            # Crear detalle
            detalle = DetalleOrden(
                id_orden=orden.id_orden,
                id_producto=item.id_producto,
                id_variante=id_variante,
                tipo_variante=tipo_variante,
                nombre_variante=nombre_variante,
                color_hex_variante=color_hex_variante,
                id_lote=id_lote,
                cantidad=item.cantidad,
                precio_unitario=precio.precio_venta,
                porcentaje_iva=porcentaje_iva,
                subtotal_linea=subtotal_linea,
            )
            await self.orden_repo.add_detalle(detalle)

            # Descontar stock
            try:
                await self.inv_repo.update_stock(inv, -item.cantidad)
            except ValueError:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"Stock insuficiente para producto {item.id_producto}",
                )

            # Registrar movimiento de inventario
            if tipo_venta and id_lote:
                mov = MovimientoInventario(
                    id_lote=id_lote,
                    id_tipo_movimiento=tipo_venta.id_tipo_movimiento,
                    id_orden=orden.id_orden,
                    cantidad=item.cantidad,
                    motivo=f"Venta - Orden #{orden.id_orden}",
                )
                await self.mov_repo.create(mov)

            subtotal += subtotal_linea
            iva_total += iva_linea

        # Actualizar totales de la orden
        descuento = min(data.descuento, subtotal)  # No permitir descuento mayor al subtotal
        total = subtotal + iva_total - descuento

        orden.subtotal = subtotal
        orden.descuento = descuento
        orden.iva_total = iva_total
        orden.total = total

        # Re-obtener la orden con detalles
        orden = await self.orden_repo.get_by_id(orden.id_orden)
        return orden  # type: ignore[return-value]

    async def list_ordenes_usuario(self, user_id: int, *, skip: int = 0, limit: int = 20) -> list[Orden]:
        return await self.orden_repo.list_by_usuario(user_id, skip=skip, limit=limit)

    async def list_all_ordenes(self, *, skip: int = 0, limit: int = 50, estado: str | None = None) -> list[Orden]:
        return await self.orden_repo.list_all(skip=skip, limit=limit, estado=estado)

    async def get_orden(self, orden_id: int, user_id: int | None = None) -> Orden:
        orden = await self.orden_repo.get_by_id(orden_id)
        if not orden:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada")
        if user_id is not None and orden.id_usuario != user_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tiene acceso a esta orden")
        return orden

    async def update_estado(self, orden_id: int, data: OrdenUpdateEstado) -> Orden:
        orden = await self.orden_repo.get_by_id(orden_id)
        if not orden:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Orden no encontrada")

        # Validar transiciones de estado
        valid_transitions = {
            "pendiente": ["procesando", "cancelado"],
            "procesando": ["enviado", "cancelado"],
            "enviado": ["entregado"],
            "entregado": [],
            "cancelado": [],
        }
        if data.estado not in valid_transitions.get(orden.estado, []):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"No se puede cambiar de '{orden.estado}' a '{data.estado}'",
            )

        # Al cancelar: reintegrar stock de cada producto de la orden
        if data.estado == "cancelado":
            tipo_devolucion = await self.tipo_repo.get_by_nombre("devolucion")
            for detalle in orden.detalles:
                inv = await self.inv_repo.get_by_producto(detalle.id_producto)
                if inv:
                    await self.inv_repo.update_stock(inv, +detalle.cantidad)

                    # Registrar movimiento de devolución al inventario
                    if tipo_devolucion and detalle.id_lote:
                        lote = await self.lote_repo.get_by_id(detalle.id_lote)
                        if lote:
                            mov = MovimientoInventario(
                                id_lote=detalle.id_lote,
                                id_tipo_movimiento=tipo_devolucion.id_tipo_movimiento,
                                id_orden=orden_id,
                                cantidad=detalle.cantidad,
                                motivo=f"Cancelación - Orden #{orden_id}",
                            )
                            await self.mov_repo.create(mov)

        return await self.orden_repo.update_estado(orden, data.estado)
