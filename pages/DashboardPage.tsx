import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { apiService } from '../services/api'

// Formatea como pesos colombianos sin decimales: 580160 → "$580.160"
const formatCOP = (value: number) =>
  '$' + Math.round(value).toLocaleString('es-CO')

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const { carrito } = useSelector((state: RootState) => state.orders)
  const isCliente = user?.rol === 'cliente'
  const [stats, setStats] = useState({
    productos: 0, ordenes: 0, ingresos: 0, stockTotal: 0, bajoStock: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [productos, ordenes] = await Promise.all([
        apiService.getProductos(),
        apiService.getOrdenes(),
      ])

      // Number() parsea el Decimal string "580160.00" → 580160 correctamente
      const totalIngresos = ordenes.reduce(
        (sum: number, o: any) => sum + Number(o.total ?? 0), 0
      )

      let stockTotal = 0
      let bajoStock = 0
      if (user?.rol === 'admin' || user?.rol === 'inventario') {
        try {
          const inv = await apiService.getStock()
          stockTotal = inv.reduce((s: number, i: any) => s + Number(i.stock_actual ?? 0), 0)
          bajoStock = inv.filter((i: any) =>
            Number(i.stock_actual) <= Number(i.stock_minimo)
          ).length
        } catch { /* sin inventario todavía */ }
      }

      setStats({ productos: productos.length, ordenes: ordenes.length, ingresos: totalIngresos, stockTotal, bajoStock })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const getDashboardContent = () => {
    if (user?.rol === 'admin') {
      const cards = [
        { label: 'Productos', value: stats.productos.toString(), note: 'Referencias activas en catalogo' },
        { label: 'Ordenes', value: stats.ordenes.toString(), note: 'Pedidos acumulados en la tienda' },
        { label: 'Stock', value: stats.stockTotal.toString(), note: 'Unidades disponibles en inventario' },
        { label: 'Ingresos', value: formatCOP(stats.ingresos), note: 'Facturacion total registrada' },
      ]

      return (
        <div className="section-stack">
          <div className="stat-grid">
            {cards.map((card) => (
              <div key={card.label} className="card metric-card">
                <span className="metric-label">{card.label}</span>
                <div className="metric-value">{card.value}</div>
                <p className="metric-note">{card.note}</p>
              </div>
            ))}
          </div>

          {stats.bajoStock > 0 && (
            <div className="alert alert-danger">
              {stats.bajoStock} producto{stats.bajoStock > 1 ? 's' : ''} con stock bajo o agotado.
            </div>
          )}

          <div className="panel hero-card">
            <div className="panel-body">
              <div className="hero-copy">
                <h3>Acciones prioritarias para el equipo</h3>
                <p>
                  Mantiene actualizado el catalogo, revisa los niveles de inventario y da seguimiento
                  a las ordenes desde una sola vista.
                </p>
              </div>
              <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate('/productos')}>
                Crear Producto
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/inventario')}>
                Ver Inventario
              </button>
              <button className="btn btn-success" onClick={() => navigate('/ordenes')}>
                Ver Ordenes
              </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (user?.rol === 'inventario') {
      const cards = [
        { label: 'Productos', value: stats.productos.toString(), note: 'Items activos listos para vender' },
        { label: 'Stock total', value: stats.stockTotal.toString(), note: 'Unidades disponibles hoy' },
        {
          label: 'Bajo stock',
          value: stats.bajoStock.toString(),
          note: 'Productos que requieren reposicion',
          warning: stats.bajoStock > 0,
        },
        { label: 'Ordenes', value: stats.ordenes.toString(), note: 'Pedidos recibidos en el sistema' },
      ]

      return (
        <div className="section-stack">
          <div className="stat-grid">
            {cards.map((card) => (
              <div key={card.label} className="card metric-card">
                <span className="metric-label">{card.label}</span>
                <div className={`metric-value${card.warning ? ' is-warning' : ''}`}>{card.value}</div>
                <p className="metric-note">{card.note}</p>
              </div>
            ))}
          </div>

          <div className="panel hero-card">
            <div className="panel-body">
              <div className="hero-copy">
                <h3>Operacion diaria de inventario</h3>
                <p>
                  Controla las existencias, responde a faltantes y revisa el flujo completo de
                  pedidos con una interfaz mas clara.
                </p>
              </div>
              <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate('/inventario')}>
                Gestionar Inventario
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/ordenes')}>
                Ver Ordenes
              </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Cliente
    return (
      <div className="section-stack">
        <div className="stat-grid">
          <div className="card metric-card">
            <span className="metric-label">Carrito</span>
            <div className="metric-value">{carrito.length}</div>
            <p className="metric-note">Productos listos para tu proxima compra</p>
          </div>
          <div className="card metric-card">
            <span className="metric-label">Mis ordenes</span>
            <div className="metric-value">{stats.ordenes}</div>
            <p className="metric-note">Pedidos que ya pasaron por checkout</p>
          </div>
        </div>

        <div className="panel hero-card">
          <div className="panel-body">
            <div className="hero-copy">
              <h3>Explora la tienda</h3>
              <p>
                Descubre referencias nuevas, revisa tu carrito y sigue el estado de tus pedidos
                desde una experiencia mas limpia y enfocada.
              </p>
            </div>
            <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/tienda')}>
              Ver catalogo
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/carrito')}>
              Mi carrito ({carrito.length})
            </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">{isCliente ? 'Mi cuenta' : 'Dashboard'}</span>
          <h2>Bienvenido, {user?.nombre}</h2>
          <p>
            {isCliente
              ? 'Consulta tu carrito, revisa el estado de tus pedidos y descubre nuevos productos para comprar.'
              : 'Una vista general del catalogo, la operacion y la actividad comercial de la tienda.'}
          </p>
        </div>
      </div>
      {getDashboardContent()}
    </div>
  )
}
