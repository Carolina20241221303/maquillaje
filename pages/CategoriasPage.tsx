import { useEffect, useState } from 'react'
import { apiService } from '../services/api'

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    nombre_categoria: '',
    descripcion: '',
    porcentaje_iva: '19.00'
  })

  useEffect(() => {
    loadCategorias()
  }, [])

  const loadCategorias = async () => {
    try {
      setLoading(true)
      const data = await apiService.getCategorias()
      setCategorias(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error loading categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await apiService.updateCategoria(editingId, form)
      } else {
        await apiService.createCategoria(form)
      }
      setForm({ nombre_categoria: '', descripcion: '', porcentaje_iva: '19.00' })
      setEditingId(null)
      setShowForm(false)
      loadCategorias()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error saving category')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta categoría?')) return
    try {
      await apiService.deleteCategoria(id)
      loadCategorias()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error deleting category')
    }
  }

  const handleEdit = (cat: any) => {
    setForm({
      nombre_categoria: cat.nombre_categoria,
      descripcion: cat.descripcion || '',
      porcentaje_iva: cat.porcentaje_iva.toString()
    })
    setEditingId(cat.id_categoria)
    setShowForm(true)
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Catalogo</span>
          <h2>Categorias</h2>
          <p>Organiza las familias del catalogo y define el IVA aplicado a cada una.</p>
        </div>
      </div>

      <div className="page-toolbar">
        <button className="btn btn-primary" onClick={() => {
          setShowForm(!showForm)
          if (showForm) {
            setEditingId(null)
            setForm({ nombre_categoria: '', descripcion: '', porcentaje_iva: '19.00' })
          }
        }}>
          {showForm ? 'Cancelar' : 'Nueva categoria'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-header">{editingId ? 'Editar categoria' : 'Crear categoria'}</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                className="form-input"
                value={form.nombre_categoria}
                onChange={(e) => setForm({ ...form, nombre_categoria: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-input"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                style={{ minHeight: '80px' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Porcentaje IVA (%)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={form.porcentaje_iva}
                onChange={(e) => setForm({ ...form, porcentaje_iva: e.target.value })}
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
            <div className="panel-title">Listado de categorias</div>
            <div className="panel-subtitle">Revisa la descripcion de cada grupo y el porcentaje de impuesto asociado.</div>
          </div>
          <div className="panel-body">
            <div className="table-wrap"><table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>IVA (%)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat) => (
                <tr key={cat.id_categoria}>
                  <td><strong>{cat.nombre_categoria}</strong></td>
                  <td style={{ maxWidth: '300px' }}>{cat.descripcion || '-'}</td>
                  <td>{cat.porcentaje_iva}%</td>
                  <td>
                    <div className="compact-actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(cat)}>
                        Editar
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cat.id_categoria)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {categorias.length === 0 && (
            <div className="empty-state">
              <strong>No hay categorias registradas</strong>
              <p>Crea la primera categoria para empezar a estructurar el catalogo.</p>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  )
}
