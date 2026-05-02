import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Producto } from '../types'
import { apiService } from '../services/api'

interface CatalogState {
  productos: Producto[]
  categorias: any[]
  marcas: any[]
  loading: boolean
  error: string | null
  lastFetch: number | null
}

const initialState: CatalogState = {
  productos: [],
  categorias: [],
  marcas: [],
  loading: false,
  error: null,
  lastFetch: null
}

export const fetchProductos = createAsyncThunk(
  'catalog/fetchProductos',
  async (args: { activo?: boolean | null } | undefined, { rejectWithValue }) => {
    try {
      return await apiService.getProductos(args?.activo)
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Error fetching products')
    }
  }
)

export const fetchCategorias = createAsyncThunk(
  'catalog/fetchCategorias',
  async (_, { rejectWithValue }) => {
    try {
      return await apiService.getCategorias()
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Error fetching categories')
    }
  }
)

export const fetchMarcas = createAsyncThunk(
  'catalog/fetchMarcas',
  async (_, { rejectWithValue }) => {
    try {
      return await apiService.getMarcas()
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Error fetching brands')
    }
  }
)

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    invalidateCache: (state) => {
      state.lastFetch = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductos.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProductos.fulfilled, (state, action) => {
        state.loading = false
        state.productos = action.payload
        state.lastFetch = Date.now()
      })
      .addCase(fetchProductos.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchCategorias.fulfilled, (state, action) => {
        state.categorias = action.payload
      })
      .addCase(fetchMarcas.fulfilled, (state, action) => {
        state.marcas = action.payload
      })
  }
})

export const { invalidateCache } = catalogSlice.actions
export default catalogSlice.reducer
