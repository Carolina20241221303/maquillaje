import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import catalogReducer from './catalogSlice'
import orderReducer from './orderSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    catalog: catalogReducer,
    orders: orderReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
