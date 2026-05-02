import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from './store'
import { fetchCurrentUser } from './store/authSlice'

import { LoginPage }       from './pages/LoginPage'
import { DashboardPage }   from './pages/DashboardPage'
import { ProductosPage }   from './pages/ProductosPage'
import { TiendaPage }      from './pages/TiendaPage'
import { CartPage }        from './pages/CartPage'
import { OrdenesPage }     from './pages/OrdenesPage'
import { InventarioPage }  from './pages/InventarioPage'
import { CategoriasPage }  from './pages/CategoriasPage'
import { MarcasPage }      from './pages/MarcasPage'
import { ProveedoresPage } from './pages/ProveedoresPage'
import { DireccionesPage } from './pages/DireccionesPage'
import { Sidebar }         from './components/Sidebar'
import { Header }          from './components/Header'

import './styles/global.css'
import './styles/layout.css'
import './styles/components.css'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useSelector((s: RootState) => s.auth)
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  )
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useSelector((s: RootState) => s.auth)
  if (!user || !roles.includes(user.rol))
    return (
      <div className="card">
        <div className="card-header">Acceso denegado</div>
        <p style={{ color: 'var(--danger)', lineHeight: 1.7 }}>
          No tienes permiso para acceder a esta seccion.
        </p>
      </div>
    )
  return <>{children}</>
}

function WIP({ title }: { title: string }) {
  return (
    <div className="card">
      <div className="card-header">{title}</div>
      <p style={{ color: 'var(--ink-500)', lineHeight: 1.7 }}>Modulo en desarrollo.</p>
    </div>
  )
}

// Layout con sidebar controlado
function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Cerrar sidebar al navegar
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  )
}

function AppRoutes() {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated } = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token && !isAuthenticated) dispatch(fetchCurrentUser())
  }, [dispatch, isAuthenticated])

  const wrap = (el: React.ReactNode) => (
    <RequireAuth><AppLayout>{el}</AppLayout></RequireAuth>
  )
  const wrapRole = (roles: string[], el: React.ReactNode) => (
    <RequireAuth><AppLayout><RequireRole roles={roles}>{el}</RequireRole></AppLayout></RequireAuth>
  )

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/"            element={wrap(<DashboardPage />)} />
      <Route path="/dashboard"   element={wrap(<DashboardPage />)} />
      <Route path="/ordenes"     element={wrap(<OrdenesPage />)} />
      <Route path="/mis-ordenes" element={wrap(<OrdenesPage />)} />
      <Route path="/tienda"      element={wrap(<TiendaPage />)} />
      <Route path="/carrito"     element={wrap(<CartPage />)} />
      <Route path="/direcciones" element={wrap(<DireccionesPage />)} />

      <Route path="/productos"   element={wrapRole(['admin','inventario'], <ProductosPage />)} />
      <Route path="/inventario"  element={wrapRole(['admin','inventario'], <InventarioPage />)} />
      <Route path="/categorias"  element={wrapRole(['admin'], <CategoriasPage />)} />
      <Route path="/marcas"      element={wrapRole(['admin'], <MarcasPage />)} />
      <Route path="/proveedores" element={wrapRole(['admin'], <ProveedoresPage />)} />
      <Route path="/usuarios"    element={wrapRole(['admin'], <WIP title="Gestion de usuarios" />)} />
      <Route path="/reportes"    element={wrapRole(['admin'], <WIP title="Reportes" />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
