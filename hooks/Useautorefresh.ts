/**
 * Hook que invalida la caché de Redux al montar el componente,
 * forzando un re-fetch con datos frescos cada vez que el usuario navega.
 */
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../store'
import { fetchProductos, fetchCategorias, fetchMarcas, invalidateCache } from '../store/catalogSlice'
import { fetchOrdenes, invalidateOrderCache } from '../store/orderSlice'

type RefreshTarget = 'productos' | 'categorias' | 'marcas' | 'ordenes'

export function useAutoRefresh(targets: RefreshTarget[]) {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    // Invalida caché y re-fetchea cada target al montar
    if (targets.includes('productos')) {
      dispatch(invalidateCache())
      dispatch(fetchProductos(undefined))
    }
    if (targets.includes('categorias')) {
      dispatch(fetchCategorias())
    }
    if (targets.includes('marcas')) {
      dispatch(fetchMarcas())
    }
    if (targets.includes('ordenes')) {
      dispatch(invalidateOrderCache())
      dispatch(fetchOrdenes())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
