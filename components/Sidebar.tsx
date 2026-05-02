import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { Role } from '../types'

type NavItem = { path: string; label: string }

const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/productos', label: 'Productos' },
    { path: '/categorias', label: 'Categorias' },
    { path: '/marcas', label: 'Marcas' },
    { path: '/proveedores', label: 'Proveedores' },
    { path: '/inventario', label: 'Inventario' },
    { path: '/ordenes', label: 'Ordenes' },
  ],
  inventario: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/productos', label: 'Productos' },
    { path: '/inventario', label: 'Inventario' },
    { path: '/ordenes', label: 'Ordenes' },
  ],
  cliente: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/tienda', label: 'Tienda' },
    { path: '/carrito', label: 'Carrito' },
    { path: '/mis-ordenes', label: 'Mis ordenes' },
    { path: '/direcciones', label: 'Direcciones' },
  ],
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useSelector((s: RootState) => s.auth)
  const role = (user?.rol ?? 'cliente') as Role
  const items = NAV_ITEMS[role] ?? NAV_ITEMS.cliente

  return (
    <>
      {/* Overlay para cerrar en móvil */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-kicker">Commerce</span>
          <h1 className="sidebar-brand">Maquillaje</h1>
          <p className="sidebar-note">
            Gestion de catalogo, pedidos e inventario.
          </p>
        </div>
        <nav>
          <ul className="sidebar-nav">
            {items.map(item => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}
