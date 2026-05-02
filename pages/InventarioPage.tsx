import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { apiService } from '../services/api'

export function InventarioPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [inventario, setInventario] = useState<any[]>([])
  const [productos, setProductos] = useState<any[]>([])
  const [lotes, setLotes] = useState<any[]>([])
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [tiposMovimiento, setTiposMovimiento] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'stock' | 'lotes' | 'movimientos'>('stock')

  const [editando, setEditando] = useState<number | null>(null)
  const [nuevoMinimo, setNuevoMinimo] = useState(0)

  const [showLoteForm, setShowLoteForm] = useState(false)
  const [loteForm, setLoteForm] = useState({
    id_producto: 0,
    cantidad_inicial: 1,
    numero_lote: '',
    fecha_vencimiento: '',
  })

  const [showMovForm, setShowMovForm] = useState(false)
  const [movForm, setMovForm] = useState({
    id_lote: 0,
    id_tipo_movimiento: 0,
    cantidad: 1,
    motivo: '',
  })

  const isAdmin = user?.rol === 'admin'

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [inv, prods, lots, movs, tipos] = await Promise.all([
        apiService.getStock(),
        apiService.getProductos(),
        apiService.getLotes(),
        apiService.getMovimientos(),
        apiService.getTiposMovimiento(),
      ])
      setInventario(inv)
      setProductos(prods)
      setLotes(lots)
      setMovimientos(movs)
      setTiposMovimiento(tipos)

      if (prods.length > 0) setLoteForm(f => ({ ...f, id_producto: prods[0].id_producto }))
      if (lots.length > 0) setMovForm(f => ({ ...f, id_lote: lots[0].id_lote }))
      if (tipos.length > 0) setMovForm(f => ({ ...f, id_tipo_movimiento: tipos[0].id_tipo_movimiento }))
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar inventario')
    } finally {
      setLoading(false)
    }
  }

  const getNombreProducto = (id: number) => {
    const p = productos.find(p => p.id_producto === id)
    return p?.nombre_producto || `Producto #${id}`
  }

  const getNombreLote = (id: number) => {
    const l = lotes.find(l => l.id_lote === id)
    if (!l) return `Lote #${id}`
    return `Lote #${id} · ${getNombreProducto(l.id_producto)}`
  }

  const getNombreTipo = (id: number) => {
    const t = tiposMovimiento.find(t => t.id_tipo_movimiento === id)
    return t?.nombre_tipo || `Tipo #${id}`
  }

  const getEstadoStock = (item: any) => {
    if (item.stock_actual === 0) return { label: 'Sin stock', cls: 'badge-danger' }
    if (item.stock_actual <= item.stock_minimo) return { label: 'Bajo stock', cls: 'badge-danger' }
    if (item.stock_maximo && item.stock_actual >= item.stock_maximo) return { label: 'Stock alto', cls: 'badge-warning' }
    return { label: 'Normal', cls: 'badge-success' }
  }

  const handleGuardarMinimo = async (id_producto: number) => {
    try {
      setError('')
      await apiService.updateInventario(id_producto, { stock_minimo: nuevoMinimo })
      setSuccess('Stock minimo actualizado')
      setTimeout(() => setSuccess(''), 2500)
      setEditando(null)
      loadAll()
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al actualizar')
    }
  }

  const handleCrearLote = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      const payload: any = {
        id_producto: loteForm.id_producto,
        cantidad_inicial: loteForm.cantidad_inicial,
      }
      if (loteForm.numero_lote) payload.numero_lote = loteForm.numero_lote
      if (loteForm.fecha_vencimiento) payload.fecha_vencimiento = loteForm.fecha_vencimiento

      await apiService.createLote(payload)

      setSuccess('Lote creado correctamente')
      setTimeout(() => setSuccess(''), 2500)
      setShowLoteForm(false)
      setLoteForm({ id_producto: productos[0]?.id_producto || 0, cantidad_inicial: 1, numero_lote: '', fecha_vencimiento: '' })
      loadAll()
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al crear lote')
    }
  }

  const handleCrearMovimiento = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      await apiService.createMovimiento({
        id_lote: movForm.id_lote,
        id_tipo_movimiento: movForm.id_tipo_movimiento,
        cantidad: movForm.cantidad,
        motivo: movForm.motivo || undefined,
      })
      setSuccess('Movimiento registrado')
      setTimeout(() => setSuccess(''), 2500)
      setShowMovForm(false)
      setMovForm({ id_lote: lotes[0]?.id_lote || 0, id_tipo_movimiento: tiposMovimiento[0]?.id_tipo_movimiento || 0, cantidad: 1, motivo: '' })
      loadAll()
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al registrar movimiento')
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Operaciones</span>
          <h2>Inventario</h2>
          <p>Controla stock, lotes y movimientos con una vista operativa mas clara y ordenada.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="tabs">
        <button className={`tab-button${activeTab === 'stock' ? ' active' : ''}`} onClick={() => setActiveTab('stock')}>
          Stock
        </button>
        <button className={`tab-button${activeTab === 'lotes' ? ' active' : ''}`} onClick={() => setActiveTab('lotes')}>
          Lotes
        </button>
        <button className={`tab-button${activeTab === 'movimientos' ? ' active' : ''}`} onClick={() => setActiveTab('movimientos')}>
          Movimientos
        </button>
      </div>

      {loading ? (
        <div className="center-spinner"><div className="spinner" /></div>
      ) : (
        <>
          {activeTab === 'stock' && (
            inventario.length === 0 ? (
              <div className="empty-state">
                <strong>No hay registros de inventario</strong>
                <p>Crea un lote para empezar a reflejar existencias en esta seccion.</p>
              </div>
            ) : (
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Stock por producto</div>
                  <div className="panel-subtitle">Consulta niveles actuales, umbral minimo y alertas operativas.</div>
                </div>
                <div className="panel-body">
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Stock actual</th>
                          <th>Minimo</th>
                          <th>Maximo</th>
                          <th>Ubicacion</th>
                          <th>Estado</th>
                          {isAdmin && <th>Acciones</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {inventario.map((item) => {
                          const est = getEstadoStock(item)
                          return (
                            <tr key={item.id_producto}>
                              <td><strong>{getNombreProducto(item.id_producto)}</strong></td>
                              <td><strong>{item.stock_actual}</strong></td>
                              <td>
                                {editando === item.id_producto ? (
                                  <div className="compact-actions">
                                    <input
                                      type="number"
                                      min="0"
                                      value={nuevoMinimo}
                                      onChange={e => setNuevoMinimo(parseInt(e.target.value) || 0)}
                                      style={{ maxWidth: '92px' }}
                                    />
                                    <button className="btn btn-success btn-sm" onClick={() => handleGuardarMinimo(item.id_producto)}>
                                      Guardar
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditando(null)}>
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  item.stock_minimo
                                )}
                              </td>
                              <td>{item.stock_maximo ?? '—'}</td>
                              <td>{item.ubicacion_tienda ?? '—'}</td>
                              <td><span className={`badge ${est.cls}`}>{est.label}</span></td>
                              {isAdmin && (
                                <td>
                                  {editando !== item.id_producto && (
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => { setEditando(item.id_producto); setNuevoMinimo(item.stock_minimo) }}
                                    >
                                      Editar minimo
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {activeTab === 'lotes' && (
            <div className="section-stack">
              <div className="page-toolbar">
                <button className="btn btn-primary" onClick={() => { setShowLoteForm(!showLoteForm); setError('') }}>
                  {showLoteForm ? 'Cancelar' : 'Nuevo lote'}
                </button>
              </div>

              {showLoteForm && (
                <div className="card">
                  <div className="card-header">Registrar lote</div>
                  <form onSubmit={handleCrearLote}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Producto *</label>
                        <select
                          className="form-input"
                          required
                          value={loteForm.id_producto}
                          onChange={e => setLoteForm({ ...loteForm, id_producto: parseInt(e.target.value) })}
                        >
                          {productos.map(p => (
                            <option key={p.id_producto} value={p.id_producto}>{p.nombre_producto}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Cantidad inicial *</label>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          required
                          value={loteForm.cantidad_inicial}
                          onChange={e => setLoteForm({ ...loteForm, cantidad_inicial: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Numero de lote</label>
                        <input
                          type="text"
                          className="form-input"
                          value={loteForm.numero_lote}
                          onChange={e => setLoteForm({ ...loteForm, numero_lote: e.target.value })}
                          placeholder="LOT-2026-001"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Fecha de vencimiento</label>
                        <input
                          type="date"
                          className="form-input"
                          value={loteForm.fecha_vencimiento}
                          onChange={e => setLoteForm({ ...loteForm, fecha_vencimiento: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-success">Guardar lote</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Historial de lotes</div>
                  <div className="panel-subtitle">Visualiza lotes cargados, fecha de ingreso y vencimiento.</div>
                </div>
                <div className="panel-body">
                  {lotes.length === 0 ? (
                    <div className="empty-state">
                      <strong>No hay lotes registrados</strong>
                      <p>Cuando registres un lote aparecera en este historial.</p>
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Producto</th>
                            <th>N. lote</th>
                            <th>Cantidad inicial</th>
                            <th>Fecha ingreso</th>
                            <th>Vencimiento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lotes.map((lote) => (
                            <tr key={lote.id_lote}>
                              <td>#{lote.id_lote}</td>
                              <td>{getNombreProducto(lote.id_producto)}</td>
                              <td>{lote.numero_lote ?? '—'}</td>
                              <td>{lote.cantidad_inicial}</td>
                              <td>{new Date(lote.fecha_ingreso).toLocaleDateString('es-CO')}</td>
                              <td>{lote.fecha_vencimiento ? new Date(lote.fecha_vencimiento).toLocaleDateString('es-CO') : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'movimientos' && (
            <div className="section-stack">
              <div className="page-toolbar">
                <button className="btn btn-primary" onClick={() => { setShowMovForm(!showMovForm); setError('') }}>
                  {showMovForm ? 'Cancelar' : 'Registrar movimiento'}
                </button>
              </div>

              {showMovForm && (
                <div className="card">
                  <div className="card-header">Nuevo movimiento</div>
                  <form onSubmit={handleCrearMovimiento}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Lote *</label>
                        <select
                          className="form-input"
                          required
                          value={movForm.id_lote}
                          onChange={e => setMovForm({ ...movForm, id_lote: parseInt(e.target.value) })}
                        >
                          {lotes.map(l => (
                            <option key={l.id_lote} value={l.id_lote}>{getNombreLote(l.id_lote)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Tipo *</label>
                        <select
                          className="form-input"
                          required
                          value={movForm.id_tipo_movimiento}
                          onChange={e => setMovForm({ ...movForm, id_tipo_movimiento: parseInt(e.target.value) })}
                        >
                          {tiposMovimiento.map(t => (
                            <option key={t.id_tipo_movimiento} value={t.id_tipo_movimiento}>{t.nombre_tipo}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Cantidad *</label>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          required
                          value={movForm.cantidad}
                          onChange={e => setMovForm({ ...movForm, cantidad: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Motivo</label>
                        <input
                          type="text"
                          className="form-input"
                          value={movForm.motivo}
                          onChange={e => setMovForm({ ...movForm, motivo: e.target.value })}
                          placeholder="Descripcion opcional"
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-success">Registrar</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">Movimientos recientes</div>
                  <div className="panel-subtitle">Consulta el historial de entradas, salidas y ajustes por lote.</div>
                </div>
                <div className="panel-body">
                  {movimientos.length === 0 ? (
                    <div className="empty-state">
                      <strong>No hay movimientos registrados</strong>
                      <p>Los movimientos de inventario apareceran aqui cuando empieces a operarlos.</p>
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Lote / Producto</th>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Fecha</th>
                            <th>Motivo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movimientos.map((mov) => (
                            <tr key={mov.id_movimiento}>
                              <td>#{mov.id_movimiento}</td>
                              <td>{getNombreLote(mov.id_lote)}</td>
                              <td>{getNombreTipo(mov.id_tipo_movimiento)}</td>
                              <td><strong>{mov.cantidad}</strong></td>
                              <td>{new Date(mov.fecha).toLocaleDateString('es-CO')}</td>
                              <td>{mov.motivo ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
