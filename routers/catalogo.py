"""Router de Catálogo."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.catalogo import (
    CategoriaCreate,
    CategoriaResponse,
    CategoriaUpdate,
    MarcaCreate,
    MarcaResponse,
    MarcaUpdate,
    PrecioCreate,
    PrecioResponse,
    ProductoCreate,
    ProductoDetalleResponse,
    ProductoResponse,
    ProductoVarianteCreate,
    ProductoVarianteResponse,
    ProductoVarianteUpdate,
    ProductoUpdate,
    UnidadMedidaCreate,
    UnidadMedidaResponse,
    UnidadMedidaUpdate,
)
from app.services.catalogo import CatalogoService
from app.dependencies import require_roles

router = APIRouter()


# ── Categorías ──
@router.get("/categorias", response_model=list[CategoriaResponse])
async def list_categorias(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario", "cliente")),
):
    service = CatalogoService(db)
    return await service.list_categorias()


@router.get("/categorias/{cat_id}", response_model=CategoriaResponse)
async def get_categoria(
    cat_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario", "cliente")),
):
    service = CatalogoService(db)
    return await service.get_categoria(cat_id)


@router.post("/categorias", response_model=CategoriaResponse)
async def create_categoria(
    data: CategoriaCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    return await service.create_categoria(data)


@router.put("/categorias/{cat_id}", response_model=CategoriaResponse)
async def update_categoria(
    cat_id: int,
    data: CategoriaUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    return await service.update_categoria(cat_id, data)


@router.delete("/categorias/{cat_id}")
async def delete_categoria(
    cat_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    await service.delete_categoria(cat_id)
    return {"message": "Categoría eliminada"}


# ── Marcas ──
@router.get("/marcas", response_model=list[MarcaResponse])
async def list_marcas(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario", "cliente")),
):
    service = CatalogoService(db)
    return await service.list_marcas()


@router.get("/marcas/{marca_id}", response_model=MarcaResponse)
async def get_marca(
    marca_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario", "cliente")),
):
    service = CatalogoService(db)
    return await service.get_marca(marca_id)


@router.post("/marcas", response_model=MarcaResponse)
async def create_marca(
    data: MarcaCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    return await service.create_marca(data)


@router.put("/marcas/{marca_id}", response_model=MarcaResponse)
async def update_marca(
    marca_id: int,
    data: MarcaUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    return await service.update_marca(marca_id, data)


@router.delete("/marcas/{marca_id}")
async def delete_marca(
    marca_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    await service.delete_marca(marca_id)
    return {"message": "Marca eliminada"}


# ── Unidades de Medida ──
@router.get("/unidades", response_model=list[UnidadMedidaResponse])
async def list_unidades(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario", "cliente")),
):
    service = CatalogoService(db)
    return await service.list_unidades()


@router.get("/unidades/{unidad_id}", response_model=UnidadMedidaResponse)
async def get_unidad(
    unidad_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario", "cliente")),
):
    service = CatalogoService(db)
    return await service.get_unidad(unidad_id)


@router.post("/unidades", response_model=UnidadMedidaResponse)
async def create_unidad(
    data: UnidadMedidaCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    return await service.create_unidad(data)


@router.put("/unidades/{unidad_id}", response_model=UnidadMedidaResponse)
async def update_unidad(
    unidad_id: int,
    data: UnidadMedidaUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    return await service.update_unidad(unidad_id, data)


@router.delete("/unidades/{unidad_id}")
async def delete_unidad(
    unidad_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    await service.delete_unidad(unidad_id)
    return {"message": "Unidad eliminada"}


# ── Productos ──
@router.get("/productos", response_model=list[ProductoDetalleResponse])
async def list_productos(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    activo: bool | None = Query(True),
    id_categoria: int | None = Query(None),
    id_marca: int | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario", "cliente")),
):
    service = CatalogoService(db)
    return await service.list_productos(
        skip=skip,
        limit=limit,
        activo=activo,
        id_categoria=id_categoria,
        id_marca=id_marca,
        search=search,
    )


@router.get("/productos/{prod_id}", response_model=ProductoDetalleResponse)
async def get_producto(
    prod_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario", "cliente")),
):
    service = CatalogoService(db)
    return await service.get_producto_detalle(prod_id)


@router.post("/productos", response_model=ProductoResponse)
async def create_producto(
    data: ProductoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    return await service.create_producto(data)


@router.put("/productos/{prod_id}", response_model=ProductoResponse)
async def update_producto(
    prod_id: int,
    data: ProductoUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    return await service.update_producto(prod_id, data)


@router.delete("/productos/{prod_id}")
async def delete_producto(
    prod_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    await service.delete_producto(prod_id)
    return {"message": "Producto eliminado"}


@router.get("/productos/{prod_id}/variantes", response_model=list[ProductoVarianteResponse])
async def list_variantes(
    prod_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario", "cliente")),
):
    service = CatalogoService(db)
    return await service.list_variantes(prod_id)


@router.post("/productos/{prod_id}/variantes", response_model=ProductoVarianteResponse)
async def create_variante(
    prod_id: int,
    data: ProductoVarianteCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    return await service.create_variante(prod_id, data)


@router.put("/productos/{prod_id}/variantes/{var_id}", response_model=ProductoVarianteResponse)
async def update_variante(
    prod_id: int,
    var_id: int,
    data: ProductoVarianteUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    return await service.update_variante(prod_id, var_id, data)


@router.delete("/productos/{prod_id}/variantes/{var_id}")
async def delete_variante(
    prod_id: int,
    var_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    await service.delete_variante(prod_id, var_id)
    return {"message": "Variante eliminada"}


# ── Precios ──
@router.get("/productos/{prod_id}/precios", response_model=list[PrecioResponse])
async def list_precios(
    prod_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin", "inventario")),
):
    service = CatalogoService(db)
    return await service.list_precios(prod_id)


@router.post("/precios", response_model=PrecioResponse)
async def create_precio(
    data: PrecioCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    return await service.create_precio(data)

# ── Imagen de Producto ──
import os, uuid, shutil
from fastapi import UploadFile, File, HTTPException

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 5

@router.post("/productos/{prod_id}/imagen", response_model=ProductoResponse)
async def upload_imagen_producto(
    prod_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    # Validar tipo MIME
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes JPG, PNG o WebP")

    # Leer y validar tamaño
    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"La imagen no puede superar {MAX_SIZE_MB}MB")

    # Generar nombre único seguro (sin confiar en el nombre original)
    ext = file.content_type.split("/")[-1].replace("jpeg", "jpg")
    filename = f"producto_{prod_id}_{uuid.uuid4().hex[:8]}.{ext}"
    upload_dir = "static/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)

    # Guardar archivo
    with open(filepath, "wb") as f:
        f.write(contents)

    # Actualizar imagen_url en BD (URL relativa servida por /static)
    imagen_url = f"/static/uploads/{filename}"
    service = CatalogoService(db)
    from app.schemas.catalogo import ProductoUpdate
    return await service.update_producto(prod_id, ProductoUpdate(imagen_url=imagen_url))


@router.delete("/productos/{prod_id}/imagen", response_model=ProductoResponse)
async def delete_imagen_producto(
    prod_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles("admin")),
):
    service = CatalogoService(db)
    prod = await service.get_producto(prod_id)

    # Eliminar archivo físico si existe
    if prod.imagen_url and prod.imagen_url.startswith("/static/uploads/"):
        filepath = prod.imagen_url.lstrip("/")
        if os.path.exists(filepath):
            os.remove(filepath)

    from app.schemas.catalogo import ProductoUpdate
    return await service.update_producto(prod_id, ProductoUpdate(imagen_url=None))
