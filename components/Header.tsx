import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store'
import { logout } from '../store/authSlice'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user }  = useSelector((s: RootState) => s.auth)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  const rolLabel =
    user?.rol === 'admin'      ? 'Administrador' :
    user?.rol === 'inventario' ? 'Inventario' : 'Cliente'

  const pageMeta: Record<string, { eyebrow: string; title: string }> = {
    '/': { eyebrow: 'Resumen', title: 'Vista general del negocio' },
    '/dashboard': { eyebrow: 'Resumen', title: 'Vista general del negocio' },
    '/productos': { eyebrow: 'Catalogo', title: 'Productos y contenido comercial' },
    '/categorias': { eyebrow: 'Catalogo', title: 'Categorias e impuestos' },
    '/marcas': { eyebrow: 'Catalogo', title: 'Marcas y origen de producto' },
    '/proveedores': { eyebrow: 'Abastecimiento', title: 'Relacion con proveedores' },
    '/inventario': { eyebrow: 'Operaciones', title: 'Stock, lotes y movimientos' },
    '/ordenes': { eyebrow: 'Pedidos', title: 'Seguimiento operativo de ordenes' },
    '/mis-ordenes': { eyebrow: 'Pedidos', title: 'Historial y seguimiento personal' },
    '/tienda': { eyebrow: 'Storefront', title: 'Catalogo para compra' },
    '/carrito': { eyebrow: 'Checkout', title: 'Revision previa a la orden' },
    '/direcciones': { eyebrow: 'Cuenta', title: 'Direcciones de envio' },
  }

  const isCliente = user?.rol === 'cliente'
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard'

  const clienteDashboardMeta = {
    eyebrow: 'Mi cuenta',
    title: 'Tu actividad en la tienda',
  }

  const meta =
    isCliente && isDashboard
      ? clienteDashboardMeta
      : (pageMeta[location.pathname] ?? { eyebrow: 'Panel', title: 'Gestion de tienda' })

  return (
    <div className="topbar">
      <div className="topbar-shell">
        <div className="topbar-leading">
          <button className="topbar-menu-btn" onClick={onMenuToggle} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="topbar-context">
            <span className="topbar-eyebrow">{meta.eyebrow}</span>
            <strong>{meta.title}</strong>
          </div>
        </div>

        <div className="topbar-user">
          <div className="user-info">
            <strong>{user?.nombre} {user?.apellido}</strong>
            <span>{rolLabel}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            cerra sesión
          </button>
        </div>
      </div>
    </div>
  )
}
