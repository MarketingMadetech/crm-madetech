// Utilitário para formatação de datas no formato brasileiro

/**
 * Converte data do formato ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
 * @param {string} dataISO - Data no formato ISO (YYYY-MM-DD) ou (YYYY-MM-DD HH:MM:SS)
 * @returns {string} Data formatada em DD/MM/YYYY ou '-' se inválida
 */
export const formatarDataBrasileira = (dataISO) => {
  if (!dataISO) return '-'
  
  // Se já está em formato brasileiro (DD/MM/YYYY), retorna como está
  if (dataISO.includes('/')) {
    return dataISO
  }
  
  // Se está em formato ISO (YYYY-MM-DD ou YYYY-MM-DD HH:MM:SS)
  if (dataISO.includes('-')) {
    try {
      // Remove a parte de hora se existir
      const dataStr = dataISO.split(' ')[0]
      const [ano, mes, dia] = dataStr.split('-')
      
      // Validação básica
      if (!ano || !mes || !dia) return '-'
      
      return `${dia}/${mes}/${ano}`
    } catch (error) {
      console.error('Erro ao formatar data:', error)
      return '-'
    }
  }
  
  return dataISO
}

/**
 * Converte data do formato brasileiro (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
 * @param {string} dataBR - Data no formato DD/MM/YYYY
 * @returns {string} Data formatada em YYYY-MM-DD ou '' se inválida
 */
export const converterParaISO = (dataBR) => {
  if (!dataBR) return ''
  
  // Se já está em formato ISO, retorna como está
  if (dataBR.includes('-')) {
    return dataBR.split(' ')[0] // Remove hora se tiver
  }
  
  // Se está em formato brasileiro (DD/MM/YYYY)
  if (dataBR.includes('/')) {
    try {
      const [dia, mes, ano] = dataBR.split('/')
      
      // Validação básica
      if (!dia || !mes || !ano) return ''
      
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
    } catch (error) {
      console.error('Erro ao converter data para ISO:', error)
      return ''
    }
  }
  
  return ''
}

/**
 * Converte string de data para objeto Date
 * @param {string} dataStr - Data em qualquer formato (ISO ou brasileiro)
 * @returns {Date|null} Objeto Date ou null se inválida
 */
export const parseData = (dataStr) => {
  if (!dataStr) return null
  
  try {
    // Formato ISO: YYYY-MM-DD ou YYYY-MM-DD HH:MM:SS
    if (dataStr.includes('-')) {
      return new Date(dataStr.split(' ')[0])
    }
    
    // Formato brasileiro: DD/MM/YYYY
    if (dataStr.includes('/')) {
      const [dia, mes, ano] = dataStr.split('/')
      return new Date(ano, mes - 1, dia)
    }
    
    return null
  } catch (error) {
    console.error('Erro ao fazer parse da data:', error)
    return null
  }
}

/**
 * Formata data para input type="date" (YYYY-MM-DD)
 * @param {string} dataStr - Data em qualquer formato
 * @returns {string} Data no formato YYYY-MM-DD para input
 */
export const formatarParaInput = (dataStr) => {
  if (!dataStr) return ''
  
  // Se já está em formato ISO, retorna (sem hora)
  if (dataStr.includes('-')) {
    return dataStr.split(' ')[0]
  }
  
  // Se está em formato brasileiro, converte
  if (dataStr.includes('/')) {
    return converterParaISO(dataStr)
  }
  
  return ''
}

export default {
  formatarDataBrasileira,
  converterParaISO,
  parseData,
  formatarParaInput
}
