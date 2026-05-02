import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProductos } from '../store/catalogSlice'
import { AppDispatch, RootState } from '../store'
import { apiService } from '../services/api'
import { useAutoRefresh } from '../hooks/Useautorefresh'
import { resolveImageUrl } from '../utils/image'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 5

const formatCOP = (value?: number | string | null) =>
  value ? '$' + Math.round(Number(value)).toLocaleString('es-CO') : 'Sin precio'

export function ProductosPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { productos, loading, categorias, marcas } = useSelector((state: RootState) => state.catalog)
  const { user } = useSelector((state: RootState) => state.auth)

  useAutoRefresh(['categorias', 'marcas'])

  const emptyForm = {
    nombre_producto: '',
    descripcion: '',
    tono: '',
    variante_tipo: '',
    variante_valor: '',
    variante_color_hex: '',
    id_categoria: 0,
    id_marca: 0,
    id_unidad_medida: 1
  }

  const [newProducto, setNewProducto] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  const [showPrecioModal, setShowPrecioModal] = useState(false)
  const [selectedProductoPrecio, setSelectedProductoPrecio] = useState<any>(null)
  const [precioData, setPrecioData] = useState({ precio_venta: '' })

  const [showInventarioModal, setShowInventarioModal] = useState(false)
  const [selectedProductoInv, setSelectedProductoInv] = useState<any>(null)
  const [inventarioData, setInventarioData] = useState({ stock_actual: '', stock_minimo: '0', stock_maximo: '' })
  const [existingInventario, setExistingInventario] = useState<any>(null)
  const [showVariantesModal, setShowVariantesModal] = useState(false)
  const [selectedProductoVariante, setSelectedProductoVariante] = useState<any>(null)
  const [varianteData, setVarianteData] = useState({ nombre_variante: '', color_hex: '', orden: '1' })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [deletedImgIds, setDeletedImgIds] = useState<Set<number>>(new Set())
  const [imgTimestamp, setImgTimestamp] = useState<number>(Date.now())

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<'activos' | 'inactivos' | 'todos'>('activos')

  const isAdmin = user?.rol === 'admin'
  const activoParam = estadoFiltro === 'todos' ? null : estadoFiltro === 'activos'
  const refresh = () => dispatch(fetchProductos({ activo: activoParam }))
  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 2500) }
  const normalizeHex = (value?: string | null) => {
    const raw = value?.trim()
    if (!raw) return null
    return raw.startsWith('#') ? raw.toUpperCase() : `#${raw.toUpperCase()}`
  }

  useEffect(() => {
    if (!showVariantesModal || !selectedProductoVariante) return
    const updated = productos.find((p: any) => p.id_producto === selectedProductoVariante.id_producto)
    if (updated) setSelectedProductoVariante(updated)
  }, [productos, selectedProductoVariante, showVariantesModal])

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(''), 5000)
    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    dispatch(fetchProductos({ activo: activoParam }))
  }, [dispatch, activoParam])

  const imgUrl = (url: string | null | undefined, id: number) => {
    if (deletedImgIds.has(id)) return null
    return resolveImageUrl(url, imgTimestamp)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('')
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Solo se permiten JPG, PNG o WebP')
      return
    }

    if (file.size > MAX_MB * 1024 * 1024) {
      setImageError(`La imagen no puede superar ${MAX_MB}MB`)
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageError('')
  }

  const handleCreateProducto = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!newProducto.id_categoria || !newProducto.id_marca) {
      setError('Selecciona categoria y marca')
      return
    }

    try {
      const payload = {
        ...newProducto,
        tono: newProducto.tono?.trim() || null,
        variante_tipo: newProducto.variante_tipo?.trim() || null,
        variante_valor: newProducto.variante_valor?.trim() || null,
        variante_color_hex: normalizeHex(newProducto.variante_color_hex),
      }

      let saved: any
      if (editingProduct) {
        saved = await apiService.updateProducto(editingProduct.id_producto, payload)
        flash('Producto actualizado')
      } else {
        saved = await apiService.createProducto(payload)
        flash('Producto creado')
      }

      if (imageFile && saved?.id_producto) {
        try {
          await apiService.uploadImagenProducto(saved.id_producto, imageFile)
        } catch {
          setError('Producto guardado pero hubo un error al subir la imagen')
        }
      }

      setNewProducto(emptyForm)
      setShowForm(false)
      setEditingProduct(null)
      clearImage()
      refresh()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar producto')
    }
  }

  const handleEditProducto = (producto: any) => {
    setEditingProduct(producto)
    setNewProducto({
      nombre_producto: producto.nombre_producto,
      descripcion: producto.descripcion || '',
      tono: producto.tono || '',
      variante_tipo: producto.variante_tipo || '',
      variante_valor: producto.variante_valor || '',
      variante_color_hex: producto.variante_color_hex || '',
      id_categoria: producto.id_categoria,
      id_marca: producto.id_marca,
      id_unidad_medida: producto.id_unidad_medida || 1,
    })
    clearImage()
    setShowForm(true)
  }

  const handleDeleteProducto = async (producto: any) => {
    const msg = producto.activo
      ? '¿Desactivar este producto? Luego podrás verlo en inactivos y eliminarlo definitivamente.'
      : '¿Eliminar definitivamente este producto inactivo? Esta acción no se puede deshacer.'
    if (!confirm(msg)) return
    try {
      setError('')
      await apiService.deleteProducto(producto.id_producto)
      flash(
        producto.activo
          ? 'Producto desactivado. Puedes verlo en "Ver solo inactivos".'
          : 'Producto eliminado definitivamente.'
      )
      refresh()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar producto')
    }
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
    setNewProducto(emptyForm)
    clearImage()
    setShowForm(false)
  }

  const handleUploadImagen = async (producto: any) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      if (!ALLOWED_TYPES.includes(file.type)) { setError('Solo JPG, PNG o WebP'); return }
      if (file.size > MAX_MB * 1024 * 1024) { setError(`Maximo ${MAX_MB}MB`); return }
      try {
        setError('')
        setUploadingId(producto.id_producto)
        await apiService.uploadImagenProducto(producto.id_producto, file)
        setImgTimestamp(Date.now())
        setDeletedImgIds(prev => {
          const next = new Set(prev)
          next.delete(producto.id_producto)
          return next
        })
        flash('Imagen actualizada')
        refresh()
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Error al subir imagen')
      } finally {
        setUploadingId(null)
      }
    }
    input.click()
  }

  const handleDeleteImagen = async (producto: any) => {
    if (!confirm('¿Eliminar la imagen de este producto?')) return
    try {
      setError('')
      setDeletedImgIds(prev => new Set(prev).add(producto.id_producto))
      await apiService.deleteImagenProducto(producto.id_producto)
      flash('Imagen eliminada')
      refresh()
    } catch (err: any) {
      setDeletedImgIds(prev => {
        const next = new Set(prev)
        next.delete(producto.id_producto)
        return next
      })
      setError(err.response?.data?.detail || 'Error al eliminar imagen')
    }
  }

  const handleOpenPrecioModal = (producto: any) => {
    setSelectedProductoPrecio(producto)
    setPrecioData({ precio_venta: producto.precio_venta?.toString() || '' })
    setShowPrecioModal(true)
  }

  const handleSavePrecio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!precioData.precio_venta) { setError('El precio es requerido'); return }
    try {
      setError('')
      await apiService.createPrecio({
        id_producto: selectedProductoPrecio.id_producto,
        precio_venta: parseFloat(precioData.precio_venta),
      })
      flash('Precio guardado')
      setShowPrecioModal(false)
      refresh()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar precio')
    }
  }

  const handleOpenInventarioModal = async (producto: any) => {
    try {
      const stock = await apiService.getStock()
      const inv = stock.find((s: any) => s.id_producto === producto.id_producto)
      setExistingInventario(inv)
      setSelectedProductoInv(producto)
      setInventarioData({
        stock_actual: inv?.stock_actual?.toString() || '',
        stock_minimo: inv?.stock_minimo?.toString() || '0',
        stock_maximo: inv?.stock_maximo?.toString() || '',
      })
      setShowInventarioModal(true)
    } catch {
      setError('Error al cargar inventario')
    }
  }

  const handleSaveInventario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inventarioData.stock_actual) { setError('El stock actual es requerido'); return }
    try {
      setError('')
      const payload = {
        stock_actual: parseInt(inventarioData.stock_actual),
        stock_minimo: parseInt(inventarioData.stock_minimo),
        stock_maximo: inventarioData.stock_maximo ? parseInt(inventarioData.stock_maximo) : null,
      }
      if (existingInventario) {
        await apiService.updateInventario(selectedProductoInv.id_producto, payload)
      } else {
        await apiService.createInventario({ id_producto: selectedProductoInv.id_producto, ...payload })
      }
      flash('Stock guardado')
      setShowInventarioModal(false)
      refresh()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar stock')
    }
  }

  const handleOpenVariantesModal = (producto: any) => {
    setSelectedProductoVariante(producto)
    setVarianteData({ nombre_variante: '', color_hex: '', orden: '1' })
    setShowVariantesModal(true)
  }

  const handleSaveVariante = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProductoVariante) return
    if (!varianteData.nombre_variante.trim()) {
      setError('El nombre de variante es requerido')
      return
    }
    try {
      setError('')
      await apiService.createVarianteProducto(selectedProductoVariante.id_producto, {
        nombre_variante: varianteData.nombre_variante.trim(),
        color_hex: normalizeHex(varianteData.color_hex),
        orden: Number(varianteData.orden) > 0 ? Number(varianteData.orden) : 1,
      })
      flash('Variante creada')
      setVarianteData({ nombre_variante: '', color_hex: '', orden: '1' })
      refresh()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar variante')
    }
  }

  const handleDeleteVariante = async (producto: any, varId?: number | null) => {
    if (!varId) return
    if (!confirm('¿Eliminar esta variante?')) return
    try {
      setError('')
      await apiService.deleteVarianteProducto(producto.id_producto, varId)
      flash('Variante eliminada')
      refresh()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar variante')
    }
  }

  if (user?.rol !== 'admin' && user?.rol !== 'inventario') {
    return (
      <div className="card">
        <div className="card-header">Acceso denegado</div>
        <p style={{ color: 'var(--danger)', lineHeight: 1.7 }}>
          Esta pagina solo es accesible para administradores e inventario.
        </p>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Catalogo</span>
          <h2>Productos</h2>
          <p>Gestiona contenido, precio, imagen y stock desde una sola vista de producto.</p>
        </div>
        <div className="page-toolbar">
          <select
            className="form-input"
            style={{ minWidth: '220px' }}
            value={estadoFiltro}
            onChange={e => setEstadoFiltro(e.target.value as 'activos' | 'inactivos' | 'todos')}
            aria-label="Filtro de estado"
          >
            <option value="activos">Ver solo activos</option>
            <option value="inactivos">Ver solo inactivos</option>
            <option value="todos">Ver todos</option>
          </select>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => {
              if (showForm) handleCancelEdit()
              else { handleCancelEdit(); setShowForm(true) }
            }}>
              {showForm ? 'Cancelar' : 'Nuevo producto'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && isAdmin && (
        <div className="card">
          <div className="card-header">{editingProduct ? 'Editar producto' : 'Nuevo producto'}</div>
          <form onSubmit={handleCreateProducto}>
            <div className="form-grid">
              <div className="form-group span-2">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={newProducto.nombre_producto}
                  onChange={e => setNewProducto({ ...newProducto, nombre_producto: e.target.value })}
                />
              </div>

              <div className="form-group span-2">
                <label className="form-label">Descripcion</label>
                <textarea
                  className="form-input"
                  value={newProducto.descripcion}
                  onChange={e => setNewProducto({ ...newProducto, descripcion: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tipo de variante (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Color, Talla, Aroma..."
                  value={newProducto.variante_tipo}
                  onChange={e => setNewProducto({ ...newProducto, variante_tipo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor de variante (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Base Liquida Tono 01, 30 gr..."
                  value={newProducto.variante_valor}
                  onChange={e => setNewProducto({ ...newProducto, variante_valor: e.target.value, tono: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Color visual (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="#EBC28D"
                  value={newProducto.variante_color_hex}
                  onChange={e => setNewProducto({ ...newProducto, variante_color_hex: e.target.value })}
                />
                <p className="form-caption">
                  Usa formato HEX para mostrar un circulo de color en la tienda.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Categoria *</label>
                <select
                  className="form-input"
                  required
                  value={newProducto.id_categoria}
                  onChange={e => setNewProducto({ ...newProducto, id_categoria: parseInt(e.target.value) })}
                >
                  <option value={0}>Seleccionar...</option>
                  {categorias.map((c: any) => (
                    <option key={c.id_categoria} value={c.id_categoria}>{c.nombre_categoria}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Marca *</label>
                <select
                  className="form-input"
                  required
                  value={newProducto.id_marca}
                  onChange={e => setNewProducto({ ...newProducto, id_marca: parseInt(e.target.value) })}
                >
                  <option value={0}>Seleccionar...</option>
                  {marcas.map((m: any) => (
                    <option key={m.id_marca} value={m.id_marca}>{m.nombre_marca}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Imagen del producto</label>
              <div className="file-preview">
                <div className="image-preview-box">
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : editingProduct?.imagen_url ? (
                    <img
                      src={imgUrl(editingProduct.imagen_url, editingProduct.id_producto)!}
                      alt="actual"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span>Vista previa</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: '240px' }}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} />
                  <p className="form-caption">JPG, PNG o WebP. Maximo {MAX_MB}MB.</p>
                  {imageError && <p className="form-caption" style={{ color: 'var(--danger)' }}>{imageError}</p>}
                  {imagePreview && (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={clearImage} style={{ marginTop: '0.75rem' }}>
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingProduct ? 'Actualizar' : 'Crear'}
              </button>
              {editingProduct && (
                <button type="button" className="btn btn-ghost" onClick={handleCancelEdit}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {showPrecioModal && (
        <div className="modal-backdrop">
          <div className="card modal-card">
            <div className="card-header">Precio de {selectedProductoPrecio?.nombre_producto}</div>
            <form onSubmit={handleSavePrecio}>
              <div className="form-group">
                <label className="form-label">Precio de venta sin IVA</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  step="0.01"
                  min="0"
                  value={precioData.precio_venta}
                  onChange={e => setPrecioData({ precio_venta: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">Guardar</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowPrecioModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInventarioModal && (
        <div className="modal-backdrop">
          <div className="card modal-card">
            <div className="card-header">Stock de {selectedProductoInv?.nombre_producto}</div>
            <form onSubmit={handleSaveInventario}>
              <div className="form-group">
                <label className="form-label">Stock actual *</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  min="0"
                  value={inventarioData.stock_actual}
                  onChange={e => setInventarioData({ ...inventarioData, stock_actual: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock minimo</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={inventarioData.stock_minimo}
                  onChange={e => setInventarioData({ ...inventarioData, stock_minimo: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock maximo</label>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  value={inventarioData.stock_maximo}
                  onChange={e => setInventarioData({ ...inventarioData, stock_maximo: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">Guardar</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowInventarioModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVariantesModal && selectedProductoVariante && (
        <div className="modal-backdrop">
          <div className="card modal-card">
            <div className="card-header">Variantes de {selectedProductoVariante?.nombre_producto}</div>
            <form onSubmit={handleSaveVariante}>
              <div className="form-group">
                <label className="form-label">Nombre de variante *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Tono 01, Rosado, Morado..."
                  value={varianteData.nombre_variante}
                  onChange={e => setVarianteData({ ...varianteData, nombre_variante: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Color HEX (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="#EBC28D"
                  value={varianteData.color_hex}
                  onChange={e => setVarianteData({ ...varianteData, color_hex: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Orden</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={varianteData.orden}
                  onChange={e => setVarianteData({ ...varianteData, orden: e.target.value })}
                />
              </div>

              <div className="variant-list-panel">
                {(selectedProductoVariante?.variantes || []).filter((v: any) => v && v.activo !== false).length === 0 ? (
                  <p className="form-caption" style={{ marginTop: 0 }}>Este producto aun no tiene variantes.</p>
                ) : (
                  <div className="variant-dot-row variant-wrap">
                    {(selectedProductoVariante?.variantes || [])
                      .filter((v: any) => v && v.activo !== false)
                      .map((v: any, idx: number) => (
                        <span key={`${v.id_variante ?? 'legacy'}-${idx}`} className="variant-item">
                          {v.color_hex && (
                            <span
                              className="variant-swatch"
                              style={{ backgroundColor: v.color_hex }}
                              title={v.nombre_variante}
                              aria-label={v.nombre_variante}
                            />
                          )}
                          <span className="variant-chip">{v.nombre_variante}</span>
                          {v.id_variante && (
                            <button
                              type="button"
                              className="variant-remove-btn"
                              onClick={() => handleDeleteVariante(selectedProductoVariante, v.id_variante)}
                              title="Eliminar variante"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-success">Guardar variante</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowVariantesModal(false)}>Cerrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="center-spinner"><div className="spinner" /></div>
      ) : productos.length === 0 ? (
        <div className="empty-state">
          <strong>No hay productos registrados</strong>
          <p>Crea el primer producto para empezar a poblar el catalogo.</p>
        </div>
      ) : (
        <div className="grid">
          {productos.map((producto: any) => {
            const stockNum = producto.stock_actual || 0
            const stockBadge = stockNum === 0 ? 'out' : stockNum <= (producto.stock_minimo || 5) ? 'low' : 'ok'
            const stockLabel = stockNum === 0
              ? 'Agotado'
              : stockNum <= (producto.stock_minimo || 5)
                ? `Stock bajo: ${stockNum}`
                : `Stock: ${stockNum}`
            const imagenSrc = imgUrl(producto.imagen_url, producto.id_producto)
            const varianteValor = (producto.variante_valor || producto.tono || '').trim()
            const varianteTipo = (producto.variante_tipo || (varianteValor ? 'Variante' : '')).trim()
            const varianteHex = (producto.variante_color_hex || '').trim()
            const variantes =
              Array.isArray(producto.variantes) && producto.variantes.length > 0
                ? producto.variantes.filter((v: any) => v && v.activo !== false)
                : (varianteValor
                  ? [{
                    id_variante: null,
                    id_producto: producto.id_producto,
                    nombre_variante: varianteValor,
                    color_hex: varianteHex || null,
                    orden: 1,
                    activo: true,
                  }]
                  : [])

            return (
              <div key={producto.id_producto} className="card product-card">
                <div className="product-img-wrap">
                  {imagenSrc ? (
                    <img
                      src={imagenSrc}
                      alt={producto.nombre_producto}
                      onError={e => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const wrap = target.parentElement
                        if (wrap && !wrap.querySelector('.img-placeholder-broken')) {
                          const ph = document.createElement('div')
                          ph.className = 'img-placeholder-broken'
                          ph.innerHTML = `
                            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <span>Sin imagen</span>
                          `
                          wrap.appendChild(ph)
                        }
                      }}
                    />
                  ) : (
                    <div className="product-img-placeholder">
                      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>{isAdmin ? 'Carga una imagen' : 'Sin imagen'}</span>
                    </div>
                  )}

                  <span className={`product-badge-stock product-badge-stock--${stockBadge}`}>
                    {stockLabel}
                  </span>

                  {isAdmin && (
                    <div className="product-img-actions">
                      <button
                        className="product-img-btn"
                        title={imagenSrc ? 'Cambiar imagen' : 'Subir imagen'}
                        disabled={uploadingId === producto.id_producto}
                        onClick={() => handleUploadImagen(producto)}
                      >
                        {uploadingId === producto.id_producto ? '...' : '↑'}
                      </button>
                      {imagenSrc && (
                        <button
                          className="product-img-btn product-img-btn--delete"
                          title="Eliminar imagen"
                          onClick={() => handleDeleteImagen(producto)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="product-body">
                  <div>
                    <h3 className="product-title">{producto.nombre_producto}</h3>
                    <p className="product-description">{producto.descripcion || 'Sin descripcion disponible.'}</p>
                  </div>

                  <div className="pill-row">
                    {!producto.activo && <span className="pill" style={{ background: '#fee2e2', color: '#991b1b' }}>Inactivo</span>}
                    {producto.nombre_marca && <span className="pill">{producto.nombre_marca}</span>}
                    {producto.nombre_categoria && <span className="pill pill-accent">{producto.nombre_categoria}</span>}
                    {!!variantes.length && (
                      <span className="pill pill-variant">
                        {`${varianteTipo || 'Variantes'} (${variantes.length})`}
                      </span>
                    )}
                  </div>

                  {!!variantes.length && (
                    <div className="variant-block">
                      <div className="variant-dot-row variant-wrap">
                        {variantes.map((v: any, idx: number) => (
                          <span key={`${v.id_variante ?? 'legacy'}-${idx}`} className="variant-item">
                            {v.color_hex && (
                              <span
                                className="variant-swatch"
                                style={{ backgroundColor: v.color_hex }}
                                title={v.nombre_variante}
                                aria-label={v.nombre_variante}
                              />
                            )}
                            <span className="variant-chip">{v.nombre_variante}</span>
                            {isAdmin && v.id_variante && (
                              <button
                                type="button"
                                className="variant-remove-btn"
                                onClick={() => handleDeleteVariante(producto, v.id_variante)}
                                title="Eliminar variante"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="product-spec">
                    <div>
                      <div className="product-spec-label">Precio final</div>
                      <div className="product-spec-value">{formatCOP(producto.precio_con_iva)}</div>
                    </div>
                    <div>
                      <div className="product-spec-label">IVA</div>
                      <div className="product-spec-value">
                        {producto.nombre_categoria ? `${producto.porcentaje_iva ?? '—'}%` : '—'}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="product-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenPrecioModal(producto)}>
                        Precio
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenInventarioModal(producto)}>
                        Stock
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenVariantesModal(producto)}>
                        Variantes
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEditProducto(producto)}>
                        Editar
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProducto(producto)}>
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
