import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../store/authSlice'
import { AppDispatch, RootState } from '../store'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await dispatch(loginUser({ email, password }))
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="login-shell">
      <section className="login-hero">
        <div className="login-copy">
          <span className="login-kicker">Beauty commerce</span>
          <h1>Tienda de Maquillaje Beauty Commerce.</h1>
          <p>
            <b>"El maquillaje no te transforma en alguien más, simplemente
               proyecta al mundo la luz que ya llevas dentro; nuestra misión
               es darte las herramientas para que esa luz propia brille hoy 
               con más fuerza que nunca."</b>
          </p>
        </div>
      </section>

      <section className="login-card-wrap">
        <div className="card login-card">
          <h2>Iniciar sesion</h2>
          <p>Accede al panel para continuar con la operacion de la tienda.</p>

          {error && <div className="alert alert-danger" style={{ marginTop: '1rem' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contrasena</label>
              <input
                type="password"
                className="form-input"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Iniciando sesion...' : 'Entrar al panel'}
            </button>
          </form>

          <div className="demo-box">
            <strong>Usuarios de prueba</strong>
            <span>admin@tienda.com · admin123456</span>
            <span>juan@example.com · password123456</span>
          </div>
        </div>
      </section>
    </div>
  )
}
