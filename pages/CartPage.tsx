import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { removerDelCarrito, actualizarCantidadCarrito, limpiarCarrito } from '../store/orderSlice'
import { AppDispatch, RootState } from '../store'
import { apiService } from '../services/api'

const formatCOP = (value: number) => '$' + Math.round(value).toLocaleString('es-CO')

export function CartPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { carrito } = useSelector((state: RootState) => state.orders)
  const { user } = useSelector((state: RootState) => state.auth)

  const [direcciones, setDirecciones] = useState<any[]>([])
  const [selectedDireccion, setSelectedDireccion] = useState<number | null>(null)
  const [showNewDireccion, setShowNewDireccion] = useState(false)
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [selectedDep, setSelectedDep] = useState<number | null>(null)
  const [ciudades, setCiudades] = useState<any[]>([])
  const [newDireccion, setNewDireccion] = useState({
    nombre_destinatario: '',
    telefono: '',
    direccion: '',
    id_ciudad: 0,
    codigo_postal: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) setNewDireccion(prev => ({ ...prev, nombre_destinatario: user.nombre }))
    loadDirecciones()
    loadDepartamentos()
  }, [user])

  const loadDirecciones = async () => {
    try {
      const dirs = await apiService.getDireccionesEnvio()
      setDirecciones(dirs)
      if (dirs.length > 0) {
        const principal = dirs.find((d: any) => d.es_principal)
        setSelectedDireccion(principal?.id_direccion || dirs[0]?.id_direccion)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadDepartamentos = async () => {
    try {
      const deps = await apiService.getDepartamentos()
      setDepartamentos(deps)
      if (deps.length > 0) {
        setSelectedDep(deps[0].id_departamento)
        await loadCiudades(deps[0].id_departamento)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadCiudades = async (depId: number) => {
    try {
      const cities = await apiService.getCiudades(depId)
      setCiudades(cities)
      if (cities.length > 0) setNewDireccion(prev => ({ ...prev, id_ciudad: cities[0].id_ciudad }))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDepChange = async (depId: number) => {
    setSelectedDep(depId)
    await loadCiudades(depId)
  }

  const handleAgregarDireccion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDireccion.nombre_destinatario || !newDireccion.direccion || !newDireccion.id_ciudad) {
      setError('Nombre, direccion y ciudad son obligatorios')
      return
    }

    try {
      setError('')
      setLoading(true)
      const direccionCreada = await apiService.createDireccionEnvio({
        nombre_destinatario: newDireccion.nombre_destinatario,
        telefono: newDireccion.telefono || null,
        direccion: newDireccion.direccion,
        id_ciudad: newDireccion.id_ciudad,
        codigo_postal: newDireccion.codigo_postal || null,
        es_principal: false,
      })
      setDirecciones(prev => [...prev, direccionCreada])
      setSelectedDireccion(direccionCreada.id_direccion)
      setShowNewDireccion(false)
      setNewDireccion({
        nombre_destinatario: user?.nombre || '',
        telefono: '',
        direccion: '',
        id_ciudad: ciudades[0]?.id_ciudad || 0,
        codigo_postal: '',
      })
      setSuccess('Direccion agregada')
      setTimeout(() => setSuccess(''), 2500)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al agregar direccion')
    } finally {
      setLoading(false)
    }
  }

  const handleCrearOrden = async () => {
    if (carrito.length === 0) { setError('El carrito esta vacio'); return }
    if (!selectedDireccion) { setError('Selecciona una direccion de envio'); return }
    try {
      setError('')
      setLoading(true)
      await apiService.createOrden({
        id_direccion: selectedDireccion,
        items: carrito.map(item => ({
          id_producto: item.id_producto,
          id_variante: item.id_variante ?? null,
          cantidad: item.cantidad,
        })),
        notas: '',
        descuento: 0,
      })
      dispatch(limpiarCarrito())
      setSuccess('Orden creada. Revisa la seccion Mis ordenes.')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear la orden')
    } finally {
      setLoading(false)
    }
  }

  const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0)

  return (
    <div className="page-shell cart-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Checkout</span>
          <h2>Carrito</h2>
          <p>Revisa cantidades, selecciona tu direccion de envio y confirma la orden.</p>
        </div>
        {carrito.length > 0 && <span className="count-badge">{carrito.length}</span>}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {carrito.length === 0 ? (
        <div className="empty-state">
          <strong>Tu carrito esta vacio</strong>
          <p>Agrega productos desde la tienda para continuar con la compra.</p>
        </div>
      ) : (
        <>
          <section className="panel">
            <div className="panel-header">
              <div className="panel-title">Productos seleccionados</div>
              <div className="panel-subtitle">
                {carrito.reduce((sum, item) => sum + item.cantidad, 0)} articulo(s) listos para checkout.
              </div>
            </div>
            <div className="cart-list">
              {carrito.map(item => (
                <div key={`${item.id_producto}-${item.id_variante ?? 'base'}`} className="cart-item">
                  <div className="product-avatar">P</div>

                  <div className="item-main">
                    <div className="item-title">{item.nombre_producto}</div>
                    {item.nombre_variante && (
                      <div className="item-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {item.color_hex_variante && (
                          <span
                            className="variant-swatch"
                            style={{ backgroundColor: item.color_hex_variante }}
                            title={item.nombre_variante}
                            aria-label={item.nombre_variante}
                          />
                        )}
                        <span>{`${item.tipo_variante || 'Variante'}: ${item.nombre_variante}`}</span>
                      </div>
                    )}
                    <div className="item-subtitle">{formatCOP(item.precio_unitario)}</div>
                  </div>

                  <div className="quantity-control">
                    <button
                      className="qty-button"
                      onClick={() => dispatch(actualizarCantidadCarrito({
                        id_producto: item.id_producto,
                        id_variante: item.id_variante ?? null,
                        cantidad: item.cantidad - 1,
                      }))}
                      disabled={item.cantidad <= 1}
                    >
                      -
                    </button>
                    <strong>{item.cantidad}</strong>
                    <button
                      className="qty-button"
                      onClick={() => dispatch(actualizarCantidadCarrito({
                        id_producto: item.id_producto,
                        id_variante: item.id_variante ?? null,
                        cantidad: item.cantidad + 1,
                      }))}
                      disabled={item.cantidad >= item.stock_disponible}
                    >
                      +
                    </button>
                    <button
                      className="remove-button"
                      onClick={() => dispatch(removerDelCarrito({
                        id_producto: item.id_producto,
                        id_variante: item.id_variante ?? null,
                      }))}
                    >
                      x
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div className="panel-title">Direccion de envio</div>
              <div className="panel-subtitle">Elige una direccion guardada o crea una nueva.</div>
            </div>

            {!showNewDireccion ? (
              <div className="option-list">
                {direcciones.length > 0 ? (
                  <>
                    {direcciones.map((dir: any) => (
                      <label key={dir.id_direccion} className={`option-row${selectedDireccion === dir.id_direccion ? ' is-selected' : ''}`}>
                        <input
                          type="radio"
                          name="direccion"
                          value={dir.id_direccion}
                          checked={selectedDireccion === dir.id_direccion}
                          onChange={() => setSelectedDireccion(dir.id_direccion)}
                        />
                        <div className="item-main">
                          <div className="item-title">
                            {dir.nombre_destinatario} {dir.es_principal && <span className="pill pill-accent">Principal</span>}
                          </div>
                          <div className="item-subtitle">
                            {dir.direccion}
                            {(dir.ciudad || dir.departamento) && ` · ${[dir.ciudad, dir.departamento].filter(Boolean).join(', ')}`}
                            {dir.codigo_postal && ` · CP ${dir.codigo_postal}`}
                            {dir.telefono && ` · Tel ${dir.telefono}`}
                          </div>
                        </div>
                      </label>
                    ))}
                    <div className="panel-footer">
                      <button className="btn btn-ghost" onClick={() => setShowNewDireccion(true)}>
                        Agregar direccion
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="panel-body">
                    <div className="empty-state">
                      <strong>No tienes direcciones guardadas</strong>
                      <p>Crea una direccion para poder finalizar tu pedido.</p>
                      <button className="btn btn-primary" onClick={() => setShowNewDireccion(true)}>
                        Crear direccion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="panel-body">
                <form onSubmit={handleAgregarDireccion}>
                  <div className="form-group">
                    <label className="form-label">Nombre destinatario *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Juan Perez"
                      value={newDireccion.nombre_destinatario}
                      onChange={e => setNewDireccion({ ...newDireccion, nombre_destinatario: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Direccion *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Calle 10 # 5-20, Apto 301"
                      value={newDireccion.direccion}
                      onChange={e => setNewDireccion({ ...newDireccion, direccion: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefono</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="3001234567"
                      value={newDireccion.telefono}
                      onChange={e => setNewDireccion({ ...newDireccion, telefono: e.target.value })}
                      maxLength={20}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Codigo postal</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="111111"
                      value={newDireccion.codigo_postal}
                      onChange={e => setNewDireccion({ ...newDireccion, codigo_postal: e.target.value })}
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Departamento</label>
                      <select className="form-input" value={selectedDep || ''} onChange={e => handleDepChange(Number(e.target.value))}>
                        {departamentos.map((dep: any) => (
                          <option key={dep.id_departamento} value={dep.id_departamento}>{dep.nombre_departamento}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ciudad *</label>
                      <select
                        className="form-input"
                        required
                        value={newDireccion.id_ciudad}
                        onChange={e => setNewDireccion({ ...newDireccion, id_ciudad: parseInt(e.target.value) })}
                      >
                        {ciudades.map((c: any) => (
                          <option key={c.id_ciudad} value={c.id_ciudad}>{c.nombre_ciudad}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Guardando...' : 'Guardar direccion'}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowNewDireccion(false)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div className="panel-title">Resumen de orden</div>
              <div className="panel-subtitle">Todos los valores se muestran con IVA incluido.</div>
            </div>
            <div className="panel-body">
              <div className="summary-list">
                {carrito.map(item => (
                  <div key={`${item.id_producto}-${item.id_variante ?? 'base'}`} className="summary-line">
                    <span>
                      {item.nombre_producto}
                      {item.nombre_variante ? ` (${item.tipo_variante || 'Variante'}: ${item.nombre_variante})` : ''}
                      {' '}x {item.cantidad}
                    </span>
                    <strong>{formatCOP(item.precio_unitario * item.cantidad)}</strong>
                  </div>
                ))}
                <div className="summary-line summary-total">
                  <span>Total estimado</span>
                  <strong>{formatCOP(totalCarrito)}</strong>
                </div>
              </div>
            </div>
          </section>

          <div className="sticky-cta">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleCrearOrden}
              disabled={carrito.length === 0 || !selectedDireccion || loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Procesando...' : `Confirmar orden · ${formatCOP(totalCarrito)}`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
