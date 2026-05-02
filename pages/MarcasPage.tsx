import { useEffect, useState } from 'react'
import { apiService } from '../services/api'

export function MarcasPage() {
  const [marcas, setMarcas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    nombre_marca: '',
    pais_origen: '',
    sitio_web: ''
  })

  useEffect(() => {
    loadMarcas()
  }, [])

  const loadMarcas = async () => {
    try {
      setLoading(true)
      const data = await apiService.getMarcas()
      setMarcas(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error loading brands')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await apiService.updateMarca(editingId, form)
      } else {
        await apiService.createMarca(form)
      }
      setForm({ nombre_marca: '', pais_origen: '', sitio_web: '' })
      setEditingId(null)
      setShowForm(false)
      loadMarcas()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error saving brand')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta marca?')) return
    try {
      await apiService.deleteMarca(id)
      loadMarcas()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error deleting brand')
    }
  }

  const handleEdit = (marca: any) => {
    setForm({
      nombre_marca: marca.nombre_marca,
      pais_origen: marca.pais_origen || '',
      sitio_web: marca.sitio_web || ''
    })
    setEditingId(marca.id_marca)
    setShowForm(true)
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Catalogo</span>
          <h2>Marcas</h2>
          <p>Administra el origen, la identidad y los enlaces de las marcas del catalogo.</p>
        </div>
      </div>

      <div className="page-toolbar">
        <button className="btn btn-primary" onClick={() => {
          setShowForm(!showForm)
          if (showForm) {
            setEditingId(null)
            setForm({ nombre_marca: '', pais_origen: '', sitio_web: '' })
          }
        }}>
          {showForm ? 'Cancelar' : 'Nueva marca'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-header">{editingId ? 'Editar marca' : 'Crear marca'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                className="form-input"
                value={form.nombre_marca}
                onChange={(e) => setForm({ ...form, nombre_marca: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">País de Origen</label>
              <input
                type="text"
                className="form-input"
                value={form.pais_origen}
                onChange={(e) => setForm({ ...form, pais_origen: e.target.value })}
                placeholder="ej: Colombia, China, USA"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Sitio Web</label>
              <input
                type="url"
                className="form-input"
                value={form.sitio_web}
                onChange={(e) => setForm({ ...form, sitio_web: e.target.value })}
                placeholder="https://www.marca.com"
              />
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
            <div className="panel-title">Listado de marcas</div>
            <div className="panel-subtitle">Consulta pais de origen, enlace de referencia y acceso rapido a edicion.</div>
          </div>
          <div className="panel-body">
            <div className="table-wrap"><table className="table">
            <thead>
              <tr>
                <th>Marca</th>
                <th>País</th>
                <th>Sitio Web</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {marcas.map((marca) => (
                <tr key={marca.id_marca}>
                  <td><strong>{marca.nombre_marca}</strong></td>
                  <td>{marca.pais_origen || '-'}</td>
                  <td>
                    {marca.sitio_web ? (
                      <a href={marca.sitio_web} target="_blank" rel="noopener noreferrer">
                        {marca.sitio_web}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <div className="compact-actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(marca)}>
                        Editar
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(marca.id_marca)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {marcas.length === 0 && (
            <div className="empty-state">
              <strong>No hay marcas registradas</strong>
              <p>Agrega una marca para enriquecer la presentacion del catalogo.</p>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  )
}
