import { useEffect, useState } from 'react'
import { apiService } from '../services/api'

export function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<any[]>([])
  const [ciudades, setCiudades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    nit: '',
    telefono: '',
    email: '',
    direccion: '',
    id_ciudad: ''
  })

  const normalizeOptional = (value: string) => {
    const v = value.trim()
    return v.length > 0 ? v : null
  }

  const getApiErrorMessage = (err: any, fallback: string) => {
    const detail = err?.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const msgs = detail.map((d: any) => d?.msg).filter(Boolean)
      if (msgs.length > 0) return msgs.join(' | ')
    }
    return fallback
  }

  useEffect(() => {
    loadProveedoresAndCities()
  }, [])

  const loadProveedoresAndCities = async () => {
    try {
      setLoading(true)
      const [prov, cities] = await Promise.all([
        apiService.getProveedores(),
        apiService.getCiudades()
      ])
      setProveedores(prov)
      setCiudades(cities)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const data = {
        nombre: form.nombre.trim(),
        nit: form.nit.trim(),
        telefono: normalizeOptional(form.telefono),
        email: normalizeOptional(form.email),
        direccion: normalizeOptional(form.direccion),
        id_ciudad: form.id_ciudad ? parseInt(form.id_ciudad) : null
      }
      if (editingId) {
        await apiService.updateProveedor(editingId, data)
      } else {
        await apiService.createProveedor(data)
      }
      setForm({ nombre: '', nit: '', telefono: '', email: '', direccion: '', id_ciudad: '' })
      setEditingId(null)
      setShowForm(false)
      loadProveedoresAndCities()
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Error saving provider'))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este proveedor?')) return
    try {
      await apiService.deleteProveedor(id)
      loadProveedoresAndCities()
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Error deleting provider'))
    }
  }

  const handleEdit = (prov: any) => {
    setForm({
      nombre: prov.nombre,
      nit: prov.nit,
      telefono: prov.telefono || '',
      email: prov.email || '',
      direccion: prov.direccion || '',
      id_ciudad: prov.id_ciudad ? prov.id_ciudad.toString() : ''
    })
    setEditingId(prov.id_proveedor)
    setShowForm(true)
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Abastecimiento</span>
          <h2>Proveedores</h2>
          <p>Centraliza la informacion de contacto y ciudad de cada proveedor activo.</p>
        </div>
      </div>

      <div className="page-toolbar">
        <button className="btn btn-primary" onClick={() => {
          setShowForm(!showForm)
          if (showForm) {
            setEditingId(null)
            setForm({ nombre: '', nit: '', telefono: '', email: '', direccion: '', id_ciudad: '' })
          }
        }}>
          {showForm ? 'Cancelar' : 'Nuevo proveedor'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-header">{editingId ? 'Editar proveedor' : 'Crear proveedor'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">NIT *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.nit}
                  onChange={(e) => setForm({ ...form, nit: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  className="form-input"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input
                type="text"
                className="form-input"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ciudad</label>
              <select
                className="form-input"
                value={form.id_ciudad}
                onChange={(e) => setForm({ ...form, id_ciudad: e.target.value })}
              >
                <option value="">Seleccionar ciudad...</option>
                {ciudades.map((ciudad: any) => (
                  <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                    {ciudad.nombre_ciudad}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-success">
              {editingId ? 'Actualizar' : 'Crear'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="center-spinner"><div className="spinner" /></div>
      ) : (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Base de proveedores</div>
            <div className="panel-subtitle">Consulta los datos clave de abastecimiento y acceso directo a edicion.</div>
          </div>
          <div className="panel-body">
            <div className="table-wrap"><table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>NIT</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((prov) => (
                <tr key={prov.id_proveedor}>
                  <td><strong>{prov.nombre}</strong></td>
                  <td>{prov.nit}</td>
                  <td>{prov.telefono || '-'}</td>
                  <td>{prov.email || '-'}</td>
                  <td>
                    <div className="compact-actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(prov)}>
                        Editar
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(prov.id_proveedor)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {proveedores.length === 0 && (
            <div className="empty-state">
              <strong>No hay proveedores registrados</strong>
              <p>Agrega un proveedor para mantener trazabilidad en el abastecimiento.</p>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  )
}
