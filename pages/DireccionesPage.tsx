import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { apiService } from '../services/api'

export function DireccionesPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [direcciones, setDirecciones] = useState<any[]>([])
  const [ciudades, setCiudades] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [selectedDep, setSelectedDep] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const emptyForm = {
    nombre_destinatario: user?.nombre || '',
    telefono: '',
    direccion: '',
    id_ciudad: 0,
    codigo_postal: '',
    es_principal: false,
  }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadDirecciones()
    loadDepartamentos()
  }, [])

  const loadDirecciones = async () => {
    try {
      const data = await apiService.getDireccionesEnvio()
      setDirecciones(data)
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al cargar direcciones')
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
    } catch (e: any) {
      console.error('Error loading departamentos:', e)
    }
  }

  const loadCiudades = async (depId: number) => {
    try {
      const cities = await apiService.getCiudades(depId)
      setCiudades(cities)
      if (cities.length > 0) {
        setForm(prev => ({ ...prev, id_ciudad: cities[0].id_ciudad }))
      }
    } catch (e: any) {
      console.error('Error loading ciudades:', e)
    }
  }

  const handleDepChange = async (depId: number) => {
    setSelectedDep(depId)
    await loadCiudades(depId)
  }

  const handleEdit = async (dir: any) => {
    setEditingId(dir.id_direccion)
    setForm({
      nombre_destinatario: dir.nombre_destinatario,
      telefono: dir.telefono || '',
      direccion: dir.direccion,
      id_ciudad: dir.id_ciudad,
      codigo_postal: dir.codigo_postal || '',
      es_principal: dir.es_principal,
    })
    if (departamentos.length === 0) await loadDepartamentos()
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre_destinatario || !form.direccion || !form.id_ciudad) {
      setError('Nombre, direccion y ciudad son obligatorios')
      return
    }
    try {
      setError('')
      setLoading(true)
      const payload = {
        nombre_destinatario: form.nombre_destinatario,
        telefono: form.telefono || null,
        direccion: form.direccion,
        id_ciudad: form.id_ciudad,
        codigo_postal: form.codigo_postal || null,
        es_principal: form.es_principal,
      }
      if (editingId) {
        await apiService.updateDireccion(editingId, payload)
        setSuccess('Direccion actualizada correctamente')
      } else {
        await apiService.createDireccionEnvio(payload)
        setSuccess('Direccion creada correctamente')
      }
      setTimeout(() => setSuccess(''), 3000)
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      loadDirecciones()
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al guardar direccion')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta direccion?')) return
    try {
      await apiService.deleteDireccion(id)
      setSuccess('Direccion eliminada')
      setTimeout(() => setSuccess(''), 2000)
      loadDirecciones()
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Error al eliminar')
    }
  }

  const getCiudadLabel = (dir: any) => {
    const parts = []
    if (dir.ciudad) parts.push(dir.ciudad)
    if (dir.departamento) parts.push(dir.departamento)
    return parts.length > 0 ? parts.join(', ') : null
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Cuenta</span>
          <h2>Direcciones</h2>
          <p>Guarda, edita y organiza las direcciones que usas para recibir tus pedidos.</p>
        </div>
        <div className="page-toolbar">
          <button className="btn btn-primary" onClick={() => {
            if (showForm) handleCancel()
            else setShowForm(true)
          }}>
            {showForm ? 'Cancelar' : 'Nueva direccion'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="card">
          <div className="card-header">{editingId ? 'Editar direccion' : 'Nueva direccion'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre del destinatario *</label>
              <input
                type="text"
                className="form-input"
                value={form.nombre_destinatario}
                onChange={e => setForm({ ...form, nombre_destinatario: e.target.value })}
                placeholder="Juan Perez"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Direccion *</label>
              <input
                type="text"
                className="form-input"
                value={form.direccion}
                onChange={e => setForm({ ...form, direccion: e.target.value })}
                placeholder="Calle 10 # 5-20, Apto 301"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefono</label>
              <input
                type="text"
                className="form-input"
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
                placeholder="3001234567"
                maxLength={20}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Departamento</label>
                <select className="form-input" value={selectedDep || ''} onChange={e => handleDepChange(Number(e.target.value))}>
                  {departamentos.map((dep: any) => (
                    <option key={dep.id_departamento} value={dep.id_departamento}>
                      {dep.nombre_departamento}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ciudad *</label>
                <select
                  className="form-input"
                  value={form.id_ciudad}
                  onChange={e => setForm({ ...form, id_ciudad: Number(e.target.value) })}
                  required
                >
                  {ciudades.length === 0 && <option value="">Sin ciudades</option>}
                  {ciudades.map((c: any) => (
                    <option key={c.id_ciudad} value={c.id_ciudad}>{c.nombre_ciudad}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Codigo postal</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.codigo_postal}
                  onChange={e => setForm({ ...form, codigo_postal: e.target.value })}
                  placeholder="111111"
                  maxLength={10}
                />
              </div>

              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="principal"
                  checked={form.es_principal}
                  onChange={e => setForm({ ...form, es_principal: e.target.checked })}
                />
                <label htmlFor="principal" className="form-label" style={{ margin: 0 }}>
                  Marcar como direccion principal
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={loading}>
                {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar direccion'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={loading}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {direcciones.length === 0 ? (
        <div className="empty-state">
          <strong>No tienes direcciones guardadas</strong>
          <p>Agrega una direccion para usarla en tus proximas compras.</p>
        </div>
      ) : (
        <div className="address-grid">
          {direcciones.map((dir: any) => (
            <div key={dir.id_direccion} className={`card address-card${dir.es_principal ? ' is-primary' : ''}`}>
              {dir.es_principal && (
                <div className="address-card-header">
                  <span className="address-badge">Principal</span>
                </div>
              )}
              <div className="address-card-body">
                <strong>{dir.nombre_destinatario}</strong>
                {dir.telefono && <p>Tel: {dir.telefono}</p>}
                <p>{dir.direccion}</p>
                {getCiudadLabel(dir) && <p>{getCiudadLabel(dir)}</p>}
                {dir.codigo_postal && <p>CP: {dir.codigo_postal}</p>}
                <div className="compact-actions" style={{ marginTop: '1rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(dir)}>
                    Editar
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(dir.id_direccion)}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
