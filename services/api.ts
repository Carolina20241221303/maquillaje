import axios, { AxiosInstance } from 'axios'
import {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserResponse,
  Producto,
  Orden,
  Pago
} from '../types'

// LOCAL dev  → http://localhost:8000  (vite devserver habla directo al backend)
// Docker     → /api  (nginx hace proxy /api/ → backend:8000)
// Render/VPS → VITE_API_URL seteado en el build
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiService {
  private client: AxiosInstance
  private refreshClient: AxiosInstance
  private refreshPromise: Promise<string> | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: { 'Content-Type': 'application/json' }
    })
    this.refreshClient = axios.create({
      baseURL: API_BASE,
      headers: { 'Content-Type': 'application/json' }
    })

    // Inyectar JWT en cada request
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token')
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    // 401 -> intentar refresh una sola vez; si falla, cerrar sesión
    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalRequest = error.config as any
        const status = error.response?.status
        const requestUrl = String(originalRequest?.url || '')
        const isAuthRefresh = requestUrl.includes('/auth/refresh')
        const isAuthLogin = requestUrl.includes('/auth/login')

        if (status !== 401 || !originalRequest || isAuthRefresh || isAuthLogin || originalRequest._retry) {
          if (status === 401 && (isAuthRefresh || isAuthLogin)) {
            this.clearSession()
          }
          return Promise.reject(error)
        }

        originalRequest._retry = true

        try {
          const newAccessToken = await this.getOrRefreshAccessToken()
          originalRequest.headers = originalRequest.headers || {}
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return this.client(originalRequest)
        } catch (refreshError) {
          this.clearSession()
          return Promise.reject(refreshError)
        }
      }
    )
  }

  private clearSession() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  private async getOrRefreshAccessToken(): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        const refresh_token = localStorage.getItem('refresh_token')
        if (!refresh_token) {
          throw new Error('No refresh token available')
        }

        const res = (await this.refreshClient.post<TokenResponse>('/auth/refresh', { refresh_token })).data
        localStorage.setItem('access_token', res.access_token)
        localStorage.setItem('refresh_token', res.refresh_token)
        return res.access_token
      })()
      .finally(() => {
        this.refreshPromise = null
      })
    }

    return this.refreshPromise
  }

  // ── Auth ──
  async register(data: RegisterRequest): Promise<UserResponse> {
    return (await this.client.post<UserResponse>('/auth/register', data)).data
  }
  async login(data: LoginRequest): Promise<TokenResponse> {
    const res = (await this.client.post<TokenResponse>('/auth/login', data)).data
    localStorage.setItem('access_token', res.access_token)
    localStorage.setItem('refresh_token', res.refresh_token)
    return res
  }
  async getCurrentUser(): Promise<UserResponse> {
    return (await this.client.get<UserResponse>('/auth/me')).data
  }
  async refreshToken(): Promise<TokenResponse> {
    const refresh_token = localStorage.getItem('refresh_token')
    if (!refresh_token) {
      throw new Error('No refresh token available')
    }
    const res = (await this.refreshClient.post<TokenResponse>('/auth/refresh', { refresh_token })).data
    localStorage.setItem('access_token', res.access_token)
    localStorage.setItem('refresh_token', res.refresh_token)
    return res
  }

  // ── Geografía ──
  async getDepartamentos() { return (await this.client.get('/geografia/departamentos')).data }
  async getCiudades(idDepartamento?: number) {
    return (await this.client.get('/geografia/ciudades', { params: { id_departamento: idDepartamento } })).data
  }

  // ── Catálogo ──
  async getProductos(activo?: boolean | null) {
    const params: Record<string, any> = {}
    if (activo !== undefined && activo !== null) params.activo = activo
    return (await this.client.get<Producto[]>('/catalogo/productos', { params })).data
  }
  async getProducto(id: number) { return (await this.client.get(`/catalogo/productos/${id}`)).data }
  async createProducto(data: any) { return (await this.client.post('/catalogo/productos', data)).data }
  async updateProducto(id: number, data: any) { return (await this.client.put(`/catalogo/productos/${id}`, data)).data }
  async deleteProducto(id: number) { await this.client.delete(`/catalogo/productos/${id}`) }
  async getVariantesProducto(id: number) { return (await this.client.get(`/catalogo/productos/${id}/variantes`)).data }
  async createVarianteProducto(id: number, data: any) { return (await this.client.post(`/catalogo/productos/${id}/variantes`, data)).data }
  async updateVarianteProducto(id: number, varId: number, data: any) {
    return (await this.client.put(`/catalogo/productos/${id}/variantes/${varId}`, data)).data
  }
  async deleteVarianteProducto(id: number, varId: number) { await this.client.delete(`/catalogo/productos/${id}/variantes/${varId}`) }
  async uploadImagenProducto(id: number, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return (await this.client.post(`/catalogo/productos/${id}/imagen`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })).data
  }
  async deleteImagenProducto(id: number) { return (await this.client.delete(`/catalogo/productos/${id}/imagen`)).data }
  async getCategorias() { return (await this.client.get('/catalogo/categorias')).data }
  async createCategoria(data: any) { return (await this.client.post('/catalogo/categorias', data)).data }
  async updateCategoria(id: number, data: any) { return (await this.client.put(`/catalogo/categorias/${id}`, data)).data }
  async deleteCategoria(id: number) { await this.client.delete(`/catalogo/categorias/${id}`) }
  async getMarcas() { return (await this.client.get('/catalogo/marcas')).data }
  async createMarca(data: any) { return (await this.client.post('/catalogo/marcas', data)).data }
  async updateMarca(id: number, data: any) { return (await this.client.put(`/catalogo/marcas/${id}`, data)).data }
  async deleteMarca(id: number) { await this.client.delete(`/catalogo/marcas/${id}`) }
  async createPrecio(data: any) { return (await this.client.post('/catalogo/precios', data)).data }

  // ── Inventario ──
  async getStock() { return (await this.client.get('/inventario/inventario')).data }
  async getLotes() { return (await this.client.get('/inventario/lotes')).data }
  async createLote(data: any) { return (await this.client.post('/inventario/lotes', data)).data }
  async createInventario(data: any) { return (await this.client.post('/inventario/inventario', data)).data }
  async updateInventario(prod_id: number, data: any) { return (await this.client.put(`/inventario/inventario/${prod_id}`, data)).data }
  async getMovimientos() { return (await this.client.get('/inventario/movimientos')).data }
  async getTiposMovimiento() { return (await this.client.get('/inventario/tipos-movimiento')).data }
  async createMovimiento(data: any) { return (await this.client.post('/inventario/movimientos', data)).data }

  // ── Órdenes ──
  async getOrdenes() { return (await this.client.get<Orden[]>('/ordenes/')).data }
  async getOrden(id: number) { return (await this.client.get<Orden>(`/ordenes/${id}`)).data }
  async createOrden(data: any) { return (await this.client.post<Orden>('/ordenes/', data)).data }
  async updateOrdenStatus(id: number, estado: string) { return (await this.client.put(`/ordenes/${id}/estado`, { estado })).data }

  // ── Pagos ──
  async createPago(data: any) { return (await this.client.post<Pago>('/pagos/', data)).data }

  // ── Proveedores ──
  async getProveedores() { return (await this.client.get('/proveedores/')).data }
  async createProveedor(data: any) { return (await this.client.post('/proveedores/', data)).data }
  async updateProveedor(id: number, data: any) { return (await this.client.put(`/proveedores/${id}`, data)).data }
  async deleteProveedor(id: number) { await this.client.delete(`/proveedores/${id}`) }

  // ── Direcciones ──
  async getDireccionesEnvio() { return (await this.client.get('/direcciones/')).data }
  async createDireccionEnvio(data: any) { return (await this.client.post('/direcciones/', data)).data }
  async deleteDireccion(id: number) { await this.client.delete(`/direcciones/${id}`) }
  async updateDireccion(id: number, data: any) { return (await this.client.put(`/direcciones/${id}`, data)).data }
}

export const apiService = new ApiService()
