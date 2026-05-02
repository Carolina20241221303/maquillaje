import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { agregarAlCarrito, sincronizarCarrito } from '../store/orderSlice'
import { AppDispatch, RootState } from '../store'
import { useAutoRefresh } from '../hooks/Useautorefresh'
import { resolveImageUrl } from '../utils/image'

const formatCOP = (value: number) => '$' + Math.round(Number(value)).toLocaleString('es-CO')

export function TiendaPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { productos, loading } = useSelector((state: RootState) => state.catalog)
  const { carrito } = useSelector((state: RootState) => state.orders)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<number, number>>({})

  useAutoRefresh(['productos'])

  useEffect(() => {
    if (productos.length > 0) {
      dispatch(sincronizarCarrito(productos))
    }
  }, [dispatch, productos])

  useEffect(() => {
    setSelectedVariantByProduct(prev => {
      const next = { ...prev }
      for (const producto of productos) {
        if (next[producto.id_producto]) continue
        const variantes = Array.isArray(producto.variantes)
          ? producto.variantes.filter((v: any) => v && v.activo !== false && typeof v.id_variante === 'number')
          : []
        if (variantes.length > 0) next[producto.id_producto] = Number(variantes[0].id_variante)
      }
      return next
    })
  }, [productos])

  const handleAgregarAlCarrito = (producto: any, varianteSeleccionada?: any) => {
    if (producto.stock_actual <= 0) {
      setError('Producto sin stock')
      return
    }

    dispatch(agregarAlCarrito({
      id_producto: producto.id_producto,
      nombre_producto: producto.nombre_producto,
      precio_unitario: producto.precio_con_iva ?? producto.precio_venta ?? 0,
      stock_disponible: producto.stock_actual ?? 0,
      id_variante: varianteSeleccionada?.id_variante ?? null,
      nombre_variante: varianteSeleccionada?.nombre_variante ?? null,
      color_hex_variante: varianteSeleccionada?.color_hex ?? null,
      tipo_variante: (producto.variante_tipo || 'Variante') ?? 'Variante',
    }))

    setError('')
    setSuccess('Producto agregado al carrito')
    setTimeout(() => setSuccess(''), 3000)
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Storefront</span>
          <h2>Tienda</h2>
          <p>Explora el catalogo y agrega productos al carrito con una vista mas editorial y limpia.</p>
        </div>
        <div className="page-toolbar">
          <button className="btn btn-primary" onClick={() => navigate('/carrito')}>
            Mi carrito ({carrito.length})
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="center-spinner"><div className="spinner" /></div>
      ) : productos.length === 0 ? (
        <div className="empty-state">
          <strong>No hay productos disponibles</strong>
          <p>Cuando el catalogo tenga inventario disponible aparecera aqui.</p>
        </div>
      ) : (
        <div className="grid">
          {productos.map((producto: any) => {
            const imagenSrc = resolveImageUrl(producto.imagen_url)
            const stockNum = producto.stock_actual || 0
            const stockBadge = stockNum === 0 ? 'out' : stockNum <= 5 ? 'low' : 'ok'
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
            const selectedVarId = selectedVariantByProduct[producto.id_producto]
            const selectedVariant =
              variantes.find((v: any) => v.id_variante && v.id_variante === selectedVarId) || variantes[0] || null
            const enCarrito = carrito.find((p: any) =>
              p.id_producto === producto.id_producto &&
              (p.id_variante ?? null) === (selectedVariant?.id_variante ?? null)
            )

            return (
              <div key={producto.id_producto} className="card product-card">
                <div className="product-img-wrap">
                  {imagenSrc ? (
                    <img
                      src={imagenSrc}
                      alt={producto.nombre_producto}
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="product-img-placeholder">
                      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>Sin imagen</span>
                    </div>
                  )}

                  <span className={`product-badge-stock product-badge-stock--${stockBadge}`}>
                    {stockNum === 0 ? 'Agotado' : `${stockNum} disponibles`}
                  </span>
                </div>

                <div className="product-body">
                  <div>
                    <h3 className="product-title">{producto.nombre_producto}</h3>
                    <p className="product-description">{producto.descripcion || 'Sin descripcion disponible.'}</p>
                  </div>

                  <div className="pill-row">
                    {producto.nombre_marca && <span className="pill">{producto.nombre_marca}</span>}
                    {producto.nombre_categoria && <span className="pill pill-accent">{producto.nombre_categoria}</span>}
                  </div>

                  {!!variantes.length && (
                    <div className="variant-block">
                      <div className="variant-label">
                        {varianteTipo || 'Variante'}:{' '}
                        <strong>{selectedVariant?.nombre_variante || variantes[0].nombre_variante}</strong>
                      </div>
                      <div className="variant-dot-row variant-wrap">
                        {variantes.map((v: any, idx: number) => {
                          const isActive = selectedVariant?.id_variante
                            ? selectedVariant.id_variante === v.id_variante
                            : idx === 0
                          return (
                            <button
                              key={`${v.id_variante ?? 'legacy'}-${idx}`}
                              type="button"
                              className={`variant-swatch variant-swatch-lg variant-swatch-btn ${isActive ? 'is-active' : ''}`}
                              style={{ backgroundColor: v.color_hex || '#E5E7EB' }}
                              title={v.nombre_variante}
                              aria-label={v.nombre_variante}
                              onClick={() => {
                                if (!v.id_variante) return
                                setSelectedVariantByProduct(prev => ({
                                  ...prev,
                                  [producto.id_producto]: v.id_variante,
                                }))
                              }}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="product-price">
                    {producto.precio_con_iva ? formatCOP(producto.precio_con_iva) : <span className="product-price-muted">Sin precio</span>}
                  </div>

                  <div className="product-actions">
                    {stockNum > 0 ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleAgregarAlCarrito(producto, selectedVariant)}
                        style={{ width: '100%' }}
                      >
                        {enCarrito ? `En carrito (${enCarrito.cantidad})` : 'Agregar al carrito'}
                      </button>
                    ) : (
                      <button className="btn btn-ghost" disabled style={{ width: '100%' }}>
                        Agotado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
