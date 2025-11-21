import axios from 'axios'
import cacheService from './cacheService'

// Armazena requisições pendentes para evitar duplicação
const pendingRequests = new Map()

/**
 * Faz uma requisição HTTP com cache e deduplicação
 * Evita múltiplas requisições iguais simultâneas
 */
export const cachedAxios = {
  get: async (url, config = {}) => {
    // Verifica cache primeiro
    const cached = cacheService.get(url)
    if (cached && !config.skipCache) {
      return { data: cached, fromCache: true }
    }

    // Se já existe requisição pendente, aguarda
    if (pendingRequests.has(url)) {
      return pendingRequests.get(url)
    }

    // Cria nova requisição
    const promise = axios.get(url, config)
      .then(response => {
        cacheService.set(url, response.data)
        pendingRequests.delete(url)
        return { data: response.data, fromCache: false }
      })
      .catch(error => {
        pendingRequests.delete(url)
        throw error
      })

    pendingRequests.set(url, promise)
    return promise
  },

  post: async (url, data, config = {}) => {
    // POST não usa cache por padrão, mas invalida cache relacionado
    const response = await axios.post(url, data, config)
    
    // Invalida cache de listagens
    if (url.includes('/api/')) {
      const resource = url.split('/')[2]
      cacheService.clearPattern(`^${resource}:`)
    }
    
    return response
  },

  put: async (url, data, config = {}) => {
    // PUT também invalida cache
    const response = await axios.put(url, data, config)
    
    if (url.includes('/api/')) {
      const resource = url.split('/')[2]
      cacheService.clearPattern(`^${resource}:`)
    }
    
    return response
  },

  delete: async (url, config = {}) => {
    // DELETE invalida cache
    const response = await axios.delete(url, config)
    
    if (url.includes('/api/')) {
      const resource = url.split('/')[2]
      cacheService.clearPattern(`^${resource}:`)
    }
    
    return response
  }
}

export default cachedAxios
