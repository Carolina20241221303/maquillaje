import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { UserResponse } from '../types'
import { apiService } from '../services/api'

interface AuthState {
  user: UserResponse | null
  token: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false
}

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const user = await apiService.getCurrentUser()
      return user
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Error fetching user')
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.login({ email, password })
      const user = await apiService.getCurrentUser()
      return { user, token: response.access_token }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Error logging in')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: any, { rejectWithValue }) => {
    try {
      const user = await apiService.register(data)
      return user
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Error registering')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload as string
      })
  }
})

export const { logout, setToken } = authSlice.actions
export default authSlice.reducer
