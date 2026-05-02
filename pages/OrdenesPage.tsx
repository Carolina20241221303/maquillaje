import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchOrdenes } from '../store/orderSlice'
import { AppDispatch, RootState } from '../store'
import { apiService } from '../services/api'
import { useAutoRefresh } from '../hooks/Useautorefresh'

export function OrdenesPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { ordenes, loading } = useSelector((state: RootState) => state.orders)
  const { user } = useSelector((state: RootState) => state.auth)

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useAutoRefresh(['ordenes'])

  const ESTADOS_VALIDOS: Record<string, string[]> = {
    pendiente: ['procesando', 'cancelado'],
    procesando: ['enviado', 'cancelado'],
    enviado: ['entregado'],
    entregado: [],
    cancelado: [],
  }

  const BADGE: Record<string, string> = {
    pendiente: 'badge-warning',
    procesando: 'badge-warning',
    enviado: 'badge-warning',
    entregado: 'badge-success',
    cancelado: 'badge-danger',
  }

  const formatCOP = (v: number | string) => '$' + Math.round(Number(v)).toLocaleString('es-CO')

  const handleCambiarEstado = async (ordenId: number, nuevoEstado: string) => {
    try {
      setError('')
      setUpdatingId(ordenId)
      await apiService.updateOrdenStatus(ordenId, nuevoEstado)
      setSuccess(`Orden #${ordenId} actualizada a ${nuevoEstado}`)
      setTimeout(() => setSuccess(''), 4000)
      dispatch(fetchOrdenes())
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar estado')
    } finally {
      setUpdatingId(null)
    }
  }

  const toggleDetalle = (id: number) => setExpandedId(prev => (prev === id ? null : id))
  const isAdmin = user?.rol === 'admin'
  const isAdminOrInventario = user?.rol === 'admin' || user?.rol === 'inventario'

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Pedidos</span>
          <h2>{user?.rol === 'cliente' ? 'Mis ordenes' : 'Gestion de ordenes'}</h2>
          <p>Consulta el historial, revisa el detalle de compra y avanza el estado operativo cuando aplique.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="center-spinner"><div className="spinner" /></div>
      ) : ordenes.length === 0 ? (
        <div className="empty-state">
          <strong>No hay ordenes registradas</strong>
          <p>Cuando exista actividad de compra aparecera aqui con su trazabilidad completa.</p>
        </div>
      ) : (
        <div className="order-list">
          {ordenes.map((orden) => {
            const isExpanded = expandedId === orden.id_orden
            const isUpdating = updatingId === orden.id_orden
            const siguientes = ESTADOS_VALIDOS[orden.estado] ?? []

            return (
              <div key={orden.id_orden} className="card order-card">
                <div
                  className={`order-summary${isExpanded ? ' is-open' : ''}`}
                  onClick={() => toggleDetalle(orden.id_orden)}
                >
                  <div className="order-topline">
                    <span className="order-number">Orden #{orden.id_orden}</span>
                    <span className="order-date">{new Date(orden.fecha_orden).toLocaleDateString('es-CO')}</span>
                    <span className={`badge ${BADGE[orden.estado] ?? 'badge-warning'}`}>{orden.estado}</span>
                    <span className="order-expand">{isExpanded ? 'Ocultar detalle' : 'Ver detalle'}</span>
                  </div>

                  <div className="order-bottomline">
                    <span className="pill">Subtotal {formatCOP(orden.subtotal)}</span>
                    <span className="pill">IVA {formatCOP(orden.iva_total)}</span>
                    <span className="pill pill-accent">Total {formatCOP(orden.total)}</span>
                  </div>

                  {isAdmin && orden.email_usuario && (
                    <div className="order-bottomline" style={{ marginTop: '0.45rem' }}>
                      <span className="pill">Cliente: {orden.email_usuario}</span>
                    </div>
                  )}

                  {isAdminOrInventario && (
                    <div className="compact-actions" style={{ marginTop: '0.85rem' }} onClick={e => e.stopPropagation()}>
                      {siguientes.map(sig => (
                        <button
                          key={sig}
                          className={`btn btn-sm ${sig === 'cancelado' ? 'btn-danger' : 'btn-secondary'}`}
                          disabled={isUpdating}
                          onClick={() => handleCambiarEstado(orden.id_orden, sig)}
                        >
                          {isUpdating ? 'Actualizando...' : `Mover a ${sig}`}
                        </button>
                      ))}
                      {siguientes.length === 0 && <span className="pill">Estado final</span>}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="order-detail">
                    {orden.direccion_envio && (
                      <div className="detail-card" style={{ marginBottom: '1rem' }}>
                        <div className="detail-title">Direccion de envio</div>
                        <div className="detail-copy">
                          <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--ink-950)' }}>
                            {orden.direccion_envio.nombre_destinatario}
                          </strong>
                          {orden.direccion_envio.telefono && <div>Tel: {orden.direccion_envio.telefono}</div>}
                          <div>{orden.direccion_envio.direccion}</div>
                          <div>
                            {[
                              orden.direccion_envio.ciudad,
                              orden.direccion_envio.departamento,
                              orden.direccion_envio.codigo_postal ? `CP ${orden.direccion_envio.codigo_postal}` : null,
                            ].filter(Boolean).join(', ')}
                          </div>
                          {orden.notas && <div style={{ marginTop: '0.45rem' }}>{orden.notas}</div>}
                        </div>
                      </div>
                    )}

                    <div className="detail-card">
                      <div className="detail-title">Detalle de productos</div>
                      {(!orden.detalles || orden.detalles.length === 0) ? (
                        <div className="detail-copy">Sin detalles disponibles</div>
                      ) : (
                        <div className="table-wrap">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Producto</th>
                                <th>Variante</th>
                                <th>Categoria</th>
                                <th>Cant.</th>
                                <th>P. Unit.</th>
                                <th>IVA</th>
                                <th>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orden.detalles.map((det, i) => (
                                <tr key={i}>
                                  <td><strong>{det.nombre_producto ?? `Producto #${det.id_producto}`}</strong></td>
                                  <td>
                                    {det.nombre_variante ? (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.42rem' }}>
                                        {det.color_hex_variante && (
                                          <span
                                            className="variant-swatch"
                                            style={{ backgroundColor: det.color_hex_variante }}
                                            title={det.nombre_variante}
                                            aria-label={det.nombre_variante}
                                          />
                                        )}
                                        <span>{`${det.tipo_variante || 'Variante'}: ${det.nombre_variante}`}</span>
                                      </span>
                                    ) : '—'}
                                  </td>
                                  <td><span className="pill">{det.nombre_categoria ?? '—'}</span></td>
                                  <td>{det.cantidad}</td>
                                  <td>{formatCOP(det.precio_unitario)}</td>
                                  <td>{Number(det.porcentaje_iva)}%</td>
                                  <td><strong>{formatCOP(det.subtotal_linea)}</strong></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
