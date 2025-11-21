import { useState, useCallback, useEffect } from 'react'
import axios from 'axios'
import cacheService from '../utils/cacheService'

/**
 * Custom hook para fazer requisições com cache automático
 * @param {string} url - URL da API
 * @param {number} ttl - Time to live do cache em ms (padrão 5min)
 * @returns {object} { data, loading, error, refetch, clearCache }
 */
export function useCachedFetch(url, ttl = 5 * 60 * 1000) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Verifica cache primeiro
    if (!forceRefresh && cacheService.has(url)) {
      setData(cacheService.get(url))
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(url)
      
      // Armazena no cache
      cacheService.set(url, response.data)
      setData(response.data)
    } catch (err) {
      setError(err.message)
      console.error(`Erro ao buscar ${url}:`, err)
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData(true) // force refresh
  }, [fetchData])

  const clearCache = useCallback(() => {
    cacheService.clear(url)
  }, [url])

  return { data, loading, error, refetch, clearCache }
}

export default useCachedFetch
