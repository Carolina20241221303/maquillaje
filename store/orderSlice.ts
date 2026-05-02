import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Orden, ProductoCarrito } from "../types";
import { apiService } from "../services/api";

interface OrderState {
  ordenes: Orden[];
  currentOrden: Orden | null;
  carrito: ProductoCarrito[];
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: OrderState = {
  ordenes: [],
  currentOrden: null,
  carrito: [],
  loading: false,
  error: null,
  lastFetch: null,
};

export const fetchOrdenes = createAsyncThunk(
  "orders/fetchOrdenes",
  async (_, { rejectWithValue }) => {
    try {
      const data = await apiService.getOrdenes();
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || "Error fetching orders",
      );
    }
  },
);

export const fetchOrden = createAsyncThunk(
  "orders/fetchOrden",
  async (id: number, { rejectWithValue }) => {
    try {
      const data = await apiService.getOrden(id);
      return data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || "Error fetching order",
      );
    }
  },
);

export const createOrden = createAsyncThunk(
  "orders/createOrden",
  async (data: any, { rejectWithValue }) => {
    try {
      const result = await apiService.createOrden(data);
      return result;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || "Error creating order",
      );
    }
  },
);

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    agregarAlCarrito: (state, action) => {
      const producto: Omit<ProductoCarrito, "cantidad"> & {
        cantidad?: number;
      } = action.payload;
      const existente = state.carrito.find(
        (p) =>
          p.id_producto === producto.id_producto &&
          (p.id_variante ?? null) === (producto.id_variante ?? null),
      );

      if (existente) {
        // Actualizar precio y stock con los valores más recientes
        existente.precio_unitario = producto.precio_unitario;
        existente.stock_disponible = producto.stock_disponible;
        existente.id_variante = producto.id_variante ?? null;
        existente.nombre_variante = producto.nombre_variante ?? null;
        existente.color_hex_variante = producto.color_hex_variante ?? null;
        existente.tipo_variante = producto.tipo_variante ?? null;
        if (existente.cantidad < existente.stock_disponible) {
          existente.cantidad += 1;
        }
      } else {
        state.carrito.push({ ...producto, cantidad: 1 } as ProductoCarrito);
      }
    },

    sincronizarCarrito: (state, action) => {
      const productos: any[] = action.payload;
      state.carrito = state.carrito.map((item) => {
        const actualizado = productos.find(
          (p) => p.id_producto === item.id_producto,
        );
        if (actualizado) {
          return {
            ...item,
            precio_unitario:
              actualizado.precio_con_iva ??
              actualizado.precio_venta ??
              item.precio_unitario,
            stock_disponible: actualizado.stock_actual ?? item.stock_disponible,
          };
        }
        return item;
      });
    },
    removerDelCarrito: (state, action) => {
      const payload = action.payload;
      if (typeof payload === "number") {
        state.carrito = state.carrito.filter((p) => p.id_producto !== payload);
        return;
      }
      state.carrito = state.carrito.filter(
        (p) =>
          !(
            p.id_producto === payload.id_producto &&
            (p.id_variante ?? null) === (payload.id_variante ?? null)
          ),
      );
    },
    actualizarCantidadCarrito: (state, action) => {
      const { id_producto, id_variante, cantidad } = action.payload;
      const producto = state.carrito.find(
        (p) =>
          p.id_producto === id_producto &&
          (p.id_variante ?? null) === (id_variante ?? null),
      );
      if (producto && cantidad > 0 && cantidad <= producto.stock_disponible) {
        producto.cantidad = cantidad;
      }
    },
    limpiarCarrito: (state) => {
      state.carrito = [];
    },
    invalidateOrderCache: (state) => {
      state.lastFetch = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrdenes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdenes.fulfilled, (state, action) => {
        state.loading = false;
        state.ordenes = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchOrdenes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchOrden.fulfilled, (state, action) => {
        state.currentOrden = action.payload;
      })
      .addCase(createOrden.fulfilled, (state, action) => {
        state.ordenes.push(action.payload);
        state.carrito = [];
      });
  },
});

export const {
  agregarAlCarrito,
  sincronizarCarrito,
  removerDelCarrito,
  actualizarCantidadCarrito,
  limpiarCarrito,
  invalidateOrderCache,
} = orderSlice.actions;
export default orderSlice.reducer;
