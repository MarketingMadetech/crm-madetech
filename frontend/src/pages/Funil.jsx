import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'

function Funil() {
  const [negocios, setNegocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [dragOverPosition, setDragOverPosition] = useState(null)
  const [busca, setBusca] = useState("")
  const [updating, setUpdating] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [animatingCard, setAnimatingCard] = useState(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [editingEtapas, setEditingEtapas] = useState([])
  
  // Refs para debounce e throttle
  const dragOverTimeout = useRef(null)
  const lastDragPosition = useRef(null)

  // Etapas salvas no localStorage
  const getEtapasFromStorage = () => {
    const saved = localStorage.getItem('crm_etapas_funil')
    if (saved) {
      return JSON.parse(saved)
    }
    // Etapas padrão
    return [
      { id: 1, nome: 'Contato inicial', cor: 'bg-blue-100 border-blue-300', corHover: 'bg-blue-200 border-blue-400', tooltip: 'Primeiro contato realizado com o cliente.' },
      { id: 2, nome: 'Proposta enviada', cor: 'bg-yellow-100 border-yellow-300', corHover: 'bg-yellow-200 border-yellow-400', tooltip: 'Proposta comercial enviada ao cliente.' },
      { id: 3, nome: 'Cliente contatado', cor: 'bg-purple-100 border-purple-300', corHover: 'bg-purple-200 border-purple-400', tooltip: 'Cliente respondeu ou foi contatado após proposta.' },
      { id: 4, nome: 'Parado', cor: 'bg-gray-100 border-gray-300', corHover: 'bg-gray-200 border-gray-400', tooltip: 'Negócio sem avanço recente ou aguardando ação.' }
    ]
  }

  const [etapas, setEtapas] = useState(getEtapasFromStorage)

  // Paleta de cores disponíveis
  const coresDisponiveis = [
    { nome: 'Azul', cor: 'bg-blue-100 border-blue-300', corHover: 'bg-blue-200 border-blue-400' },
    { nome: 'Verde', cor: 'bg-green-100 border-green-300', corHover: 'bg-green-200 border-green-400' },
    { nome: 'Amarelo', cor: 'bg-yellow-100 border-yellow-300', corHover: 'bg-yellow-200 border-yellow-400' },
    { nome: 'Vermelho', cor: 'bg-red-100 border-red-300', corHover: 'bg-red-200 border-red-400' },
    { nome: 'Roxo', cor: 'bg-purple-100 border-purple-300', corHover: 'bg-purple-200 border-purple-400' },
    { nome: 'Rosa', cor: 'bg-pink-100 border-pink-300', corHover: 'bg-pink-200 border-pink-400' },
    { nome: 'Laranja', cor: 'bg-orange-100 border-orange-300', corHover: 'bg-orange-200 border-orange-400' },
    { nome: 'Cinza', cor: 'bg-gray-100 border-gray-300', corHover: 'bg-gray-200 border-gray-400' },
    { nome: 'Índigo', cor: 'bg-indigo-100 border-indigo-300', corHover: 'bg-indigo-200 border-indigo-400' },
    { nome: 'Teal', cor: 'bg-teal-100 border-teal-300', corHover: 'bg-teal-200 border-teal-400' },
  ]

  useEffect(() => {
    loadNegocios()
  }, [])

  // Salva etapas no localStorage sempre que mudam
  useEffect(() => {
    localStorage.setItem('crm_etapas_funil', JSON.stringify(etapas))
  }, [etapas])

  const loadNegocios = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/negocios', {
        params: { status: 'Em andamento' }
      })
      setNegocios(res.data)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar negócios:', error)
      setLoading(false)
    }
  }

  const handleDragStart = (e, negocio) => {
    setDraggedItem(negocio)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget)
    
    // Adiciona estilo visual ao elemento sendo arrastado
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
    setDraggedItem(null)
    setDragOverColumn(null)
    setDragOverPosition(null)
    lastDragPosition.current = null
    
    // Limpa qualquer timeout pendente
    if (dragOverTimeout.current) {
      clearTimeout(dragOverTimeout.current)
      dragOverTimeout.current = null
    }
  }

  const handleDragOver = (e, etapaNome, cardId = null) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    
    // Não faz nada se não há item sendo arrastado
    if (!draggedItem) return
    
    // Cancela qualquer timeout pendente para manter o estado estável
    if (dragOverTimeout.current) {
      clearTimeout(dragOverTimeout.current)
      dragOverTimeout.current = null
    }
    
    // Atualiza a coluna de destaque
    if (dragOverColumn !== etapaNome) {
      setDragOverColumn(etapaNome)
    }
  }

  const handleDragEnter = (etapaNome) => {
    // Cancela timeout de saída
    if (dragOverTimeout.current) {
      clearTimeout(dragOverTimeout.current)
      dragOverTimeout.current = null
    }
    
    // Só atualiza se for diferente da coluna atual
    if (dragOverColumn !== etapaNome) {
      setDragOverColumn(etapaNome)
    }
  }

  const handleDragLeave = (e) => {
    // Verifica se realmente saiu da coluna (não apenas mudou de elemento filho)
    const relatedTarget = e.relatedTarget
    
    // Se o relatedTarget está dentro da mesma coluna, não faz nada
    if (relatedTarget && e.currentTarget.contains(relatedTarget)) {
      return
    }
    
    // Delay maior para evitar flickering ao trocar entre colunas
    if (dragOverTimeout.current) {
      clearTimeout(dragOverTimeout.current)
    }
    
    dragOverTimeout.current = setTimeout(() => {
      setDragOverColumn(null)
      setDragOverPosition(null)
    }, 100) // Aumentado de 50ms para 100ms
  }

  const handleCardDragOver = useCallback((e, negocio) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedItem || draggedItem.id === negocio.id) return
    
    // Cancela timeout de saída para manter estado estável
    if (dragOverTimeout.current) {
      clearTimeout(dragOverTimeout.current)
      dragOverTimeout.current = null
    }
    
    // Garante que a coluna está destacada
    if (dragOverColumn !== negocio.etapa) {
      setDragOverColumn(negocio.etapa)
    }
    
    // Throttle: só atualiza se mudou significativamente
    const currentPosition = `${negocio.etapa}-${negocio.id}-${Math.floor(e.clientY / 20)}`
    if (lastDragPosition.current === currentPosition) return
    
    lastDragPosition.current = currentPosition
    
    // Define o placeholder ANTES ou DEPOIS deste card baseado na posição do mouse
    const rect = e.currentTarget.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    
    // Zona morta (deadzone) de 15px para evitar flickering
    const deadzone = 15
    const relativeY = e.clientY - rect.top
    
    if (relativeY < deadzone) {
      // Muito perto do topo - placeholder ANTES
      setDragOverPosition({ etapa: negocio.etapa, beforeCardId: negocio.id })
    } else if (relativeY > rect.height - deadzone) {
      // Muito perto do fundo - placeholder DEPOIS
      setDragOverPosition({ etapa: negocio.etapa, afterCardId: negocio.id })
    } else if (e.clientY < midpoint) {
      // Mouse na metade superior - placeholder ANTES
      setDragOverPosition({ etapa: negocio.etapa, beforeCardId: negocio.id })
    } else {
      // Mouse na metade inferior - placeholder DEPOIS
      setDragOverPosition({ etapa: negocio.etapa, afterCardId: negocio.id })
    }
  }, [draggedItem, dragOverColumn])

  const handleDrop = async (e, novaEtapa) => {
    e.preventDefault()
    
    // Limpa timeouts pendentes
    if (dragOverTimeout.current) {
      clearTimeout(dragOverTimeout.current)
      dragOverTimeout.current = null
    }
    
    setDragOverColumn(null)
    setDragOverPosition(null)
    lastDragPosition.current = null
    
    if (!draggedItem || draggedItem.etapa === novaEtapa) {
      setDraggedItem(null)
      return
    }

    const antigoNegocio = { ...draggedItem }
    
    // Marca o card como animando
    setAnimatingCard(draggedItem.id)
    
    // Atualização otimista - atualiza UI imediatamente
    setNegocios(prev => prev.map(n => 
      n.id === draggedItem.id ? { ...n, etapa: novaEtapa } : n
    ))
    
    // Remove animação após 500ms
    setTimeout(() => setAnimatingCard(null), 500)
    
    setUpdating(true)
    
    try {
      await axios.put(`/api/negocios/${draggedItem.id}`, {
        ...draggedItem,
        etapa: novaEtapa
      })
      
      setLastUpdate({
        empresa: draggedItem.empresa,
        de: draggedItem.etapa,
        para: novaEtapa,
        sucesso: true
      })
      
      // Remove notificação após 3 segundos
      setTimeout(() => setLastUpdate(null), 3000)
      
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error)
      
      // Rollback - reverte para estado anterior
      setNegocios(prev => prev.map(n => 
        n.id === draggedItem.id ? antigoNegocio : n
      ))
      
      setLastUpdate({
        empresa: draggedItem.empresa,
        erro: true,
        mensagem: 'Erro ao mover negócio. Tente novamente.'
      })
      
      // Remove notificação de erro após 5 segundos
      setTimeout(() => setLastUpdate(null), 5000)
    } finally {
      setUpdating(false)
      setDraggedItem(null)
    }
  }

  const formatCurrency = (value) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // ========== FUNÇÕES DE GERENCIAMENTO DE ETAPAS ==========

  const abrirConfigEtapas = () => {
    setEditingEtapas(JSON.parse(JSON.stringify(etapas))) // Clone profundo
    setShowConfigModal(true)
  }

  const adicionarEtapa = () => {
    const novaEtapa = {
      id: Date.now(),
      nome: 'Nova Etapa',
      cor: 'bg-blue-100 border-blue-300',
      corHover: 'bg-blue-200 border-blue-400',
      tooltip: 'Descrição da etapa'
    }
    setEditingEtapas([...editingEtapas, novaEtapa])
  }

  const removerEtapa = (id) => {
    const etapa = editingEtapas.find(e => e.id === id)
    const negociosNaEtapa = negocios.filter(n => n.etapa === etapa.nome).length
    
    if (negociosNaEtapa > 0) {
      if (!window.confirm(`Existem ${negociosNaEtapa} negócio(s) nesta etapa. Ao removê-la, esses negócios ficarão sem etapa definida. Deseja continuar?`)) {
        return
      }
    }
    
    setEditingEtapas(editingEtapas.filter(e => e.id !== id))
  }

  const atualizarEtapa = (id, campo, valor) => {
    setEditingEtapas(editingEtapas.map(e => 
      e.id === id ? { ...e, [campo]: valor } : e
    ))
  }

  const moverEtapa = (index, direction) => {
    const newEtapas = [...editingEtapas]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    if (newIndex < 0 || newIndex >= newEtapas.length) return
    
    [newEtapas[index], newEtapas[newIndex]] = [newEtapas[newIndex], newEtapas[index]]
    setEditingEtapas(newEtapas)
  }

  const salvarEtapas = async () => {
    // Validação
    if (editingEtapas.length === 0) {
      alert('Deve haver pelo menos uma etapa!')
      return
    }

    const nomesDuplicados = editingEtapas.filter((e, i, arr) => 
      arr.findIndex(x => x.nome === e.nome) !== i
    )
    
    if (nomesDuplicados.length > 0) {
      alert('Não pode haver etapas com nomes duplicados!')
      return
    }

    // Mapeia etapas antigas para novas (para atualizar negócios)
    const mapeamento = {}
    etapas.forEach((antiga, i) => {
      const nova = editingEtapas[i]
      if (nova && antiga.nome !== nova.nome) {
        mapeamento[antiga.nome] = nova.nome
      }
    })

    // Atualiza negócios no backend se necessário
    if (Object.keys(mapeamento).length > 0) {
      try {
        setUpdating(true)
        
        // Atualiza cada negócio que teve sua etapa renomeada
        const updates = negocios
          .filter(n => mapeamento[n.etapa])
          .map(n => 
            axios.put(`/api/negocios/${n.id}`, { ...n, etapa: mapeamento[n.etapa] })
          )
        
        await Promise.all(updates)
        
        // Recarrega negócios
        await loadNegocios()
        
        setUpdating(false)
      } catch (error) {
        console.error('Erro ao atualizar negócios:', error)
        alert('Erro ao atualizar negócios com as novas etapas')
        setUpdating(false)
        return
      }
    }

    setEtapas(editingEtapas)
    setShowConfigModal(false)
    
    setLastUpdate({
      empresa: 'Configuração',
      de: 'Etapas',
      para: 'atualizadas',
      sucesso: true
    })
    setTimeout(() => setLastUpdate(null), 3000)
  }

  const cancelarEdicao = () => {
    setShowConfigModal(false)
    setEditingEtapas([])
  }

  const getNegociosPorEtapa = (etapaNome) => {
    // Aplica filtro de busca
    const filtrados = negocios.filter(n => {
      const buscaLower = busca.toLowerCase()
      return (
        (n.etapa === etapaNome || (!n.etapa && etapaNome === 'Sem etapa')) &&
        (
          n.empresa?.toLowerCase().includes(buscaLower) ||
          n.pessoa_contato?.toLowerCase().includes(buscaLower) ||
          n.equipamento?.toLowerCase().includes(buscaLower) ||
          buscaLower === ""
        )
      )
    })
    return filtrados
  }

  const calcularValorTotal = (etapaNome) => {
    return getNegociosPorEtapa(etapaNome).reduce((sum, n) => sum + (n.valor_oferta || 0), 0)
  }

  // Componente de Placeholder (onde o card vai cair)
  const PlaceholderCard = () => (
    <div className="bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg shadow-lg p-4 border-2 border-blue-400 border-dashed animate-pulse-slow">
      <div className="flex items-center justify-center h-20">
        <div className="text-center">
          <div className="text-3xl mb-1">📍</div>
          <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">Soltar aqui</div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Funil de Vendas</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Arraste os cards entre as colunas para mudar a etapa</p>
        </div>
        <button
          onClick={abrirConfigEtapas}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          title="Configurar etapas do funil"
        >
          <span>⚙️</span>
          <span className="font-medium">Configurar Etapas</span>
        </button>
      </div>

      {/* Notificação de atualização */}
      {lastUpdate && (
        <div className={`mx-4 p-4 rounded-lg border-2 ${lastUpdate.erro ? 'bg-red-50 border-red-300 text-red-800' : 'bg-green-50 border-green-300 text-green-800'} animate-fade-in`}>
          <div className="flex items-center">
            <span className="text-2xl mr-3">{lastUpdate.erro ? '❌' : '✅'}</span>
            <div className="flex-1">
              {lastUpdate.erro ? (
                <p className="font-medium">{lastUpdate.mensagem}</p>
              ) : (
                <p className="font-medium">
                  <strong>{lastUpdate.empresa}</strong> movido de "{lastUpdate.de}" para "{lastUpdate.para}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Indicador de atualização em progresso */}
      {updating && (
        <div className="mx-4 p-3 bg-blue-50 border border-blue-300 rounded-lg flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-sm text-blue-800">Atualizando etapa...</span>
        </div>
      )}

      {/* Campo de busca */}
      <div className="px-4 pb-2">
        <input
          type="text"
          className="w-full max-w-md border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          placeholder="🔍 Buscar por empresa, contato ou equipamento..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            className="ml-2 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 px-4">
        {etapas.map((etapa) => {
          const negociosEtapa = getNegociosPorEtapa(etapa.nome)
          const valorTotal = calcularValorTotal(etapa.nome)
          const isDropTarget = dragOverColumn === etapa.nome
          const isCurrentColumn = draggedItem?.etapa === etapa.nome
          
          return (
              <div
              key={etapa.nome}
              className={`flex-shrink-0 w-80 transition-all duration-200 ${isDropTarget ? 'scale-105' : ''}`}
              onDragOver={(e) => handleDragOver(e, etapa.nome)}
              onDragEnter={() => handleDragEnter(etapa.nome)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, etapa.nome)}
            >
              <div className={`rounded-lg border-2 p-4 h-full transition-all duration-200 ${
                isDropTarget && !isCurrentColumn 
                  ? `${etapa.corHover} shadow-lg ring-2 ring-offset-2 ring-blue-400` 
                  : etapa.cor
              }`}>
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold !text-gray-900" title={etapa.tooltip}>
                      {etapa.nome}
                      {isDropTarget && !isCurrentColumn && (
                        <span className="ml-2 text-green-600 animate-bounce">⬇️</span>
                      )}
                    </h3>
                    {negociosEtapa.length > 0 && (
                      <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {negociosEtapa.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm !text-gray-800">
                    <span className="font-medium !text-gray-800">{negociosEtapa.length} negócio(s)</span>
                    <span className="mx-2">•</span>
                    <span className="font-semibold !text-gray-900">{formatCurrency(valorTotal)}</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {negociosEtapa.length === 0 ? (
                    <div 
                      className={`text-center py-16 rounded-lg border-2 border-dashed transition-all duration-300 min-h-[200px] flex items-center justify-center ${
                        isDropTarget && !isCurrentColumn 
                          ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                          : 'border-gray-300 bg-white dark:bg-gray-800/50'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      <div>
                        <div className="text-5xl mb-3">{isDropTarget && !isCurrentColumn ? '📥' : '📋'}</div>
                        <p className={`text-sm font-medium transition-colors ${
                          isDropTarget && !isCurrentColumn 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {isDropTarget && !isCurrentColumn ? 'Solte o card aqui' : 'Nenhum negócio nesta etapa'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    negociosEtapa.map((negocio, index) => (
                      <React.Fragment key={negocio.id}>
                        {/* Placeholder ANTES deste card */}
                        {dragOverPosition?.beforeCardId === negocio.id && draggedItem?.id !== negocio.id && (
                          <PlaceholderCard />
                        )}
                        
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, negocio)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleCardDragOver(e, negocio)}
                          className={`bg-white rounded-lg shadow-md p-4 transition-all duration-300 border border-gray-200 hover:border-blue-400 ${
                            draggedItem?.id === negocio.id 
                              ? 'opacity-0 scale-50 cursor-grabbing' 
                              : animatingCard === negocio.id
                              ? 'animate-card-land cursor-grab active:cursor-grabbing hover:shadow-xl hover:scale-102'
                              : 'cursor-grab active:cursor-grabbing hover:shadow-xl hover:scale-102'
                          }`}
                        >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-gray-900 flex-1">
                            {negocio.empresa}
                          </div>
                          <div className="text-xl cursor-grab ml-2" title="Arraste para mover">
                            ⋮⋮
                          </div>
                        </div>
                        {/* Ícone pessoa_contato com tooltip */}
                        {negocio.pessoa_contato && (
                          <div className="text-sm text-gray-600 mb-2 flex items-center">
                            <span className="mr-1" title="Pessoa de contato">👤</span>
                            <span className="truncate">{negocio.pessoa_contato}</span>
                          </div>
                        )}
                        {/* Ícone equipamento com tooltip */}
                        {negocio.equipamento && (
                          <div className="text-sm text-gray-600 mb-2 flex items-center">
                            <span className="mr-1" title="Equipamento de interesse">🔧</span>
                            <span className="truncate">{negocio.equipamento}</span>
                          </div>
                        )}
                        <div className="text-base font-bold text-blue-600 mt-3 mb-2">
                          {formatCurrency(negocio.valor_oferta)}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          {/* Ícone origem com tooltip */}
                          {negocio.origem && (
                            <div className="text-xs text-gray-500 truncate flex items-center">
                              <span className="mr-1" title="Origem do lead">📍</span>
                              <span className="truncate">{negocio.origem}</span>
                            </div>
                          )}
                          {/* Ícone data_criacao com tooltip */}
                          {negocio.data_criacao && (
                            <div className="text-xs text-gray-400 flex items-center ml-2">
                              <span className="mr-1" title="Data de criação">📅</span>
                              <span>{new Date(negocio.data_criacao).toLocaleDateString('pt-BR')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                        
                        {/* Placeholder DEPOIS deste card */}
                        {dragOverPosition?.afterCardId === negocio.id && draggedItem?.id !== negocio.id && (
                          <PlaceholderCard />
                        )}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-5 mx-4 shadow-sm">
        <div className="flex items-start">
          <span className="text-3xl mr-4 mt-1">💡</span>
          <div className="flex-1">
            <p className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-2">Como usar o Funil</p>
            <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
              <li>• <strong>Arraste</strong> os cards entre as colunas para atualizar a etapa</li>
              <li>• <strong>Hover</strong> sobre as colunas para ver o destaque visual</li>
              <li>• <strong>Atualizações</strong> são feitas instantaneamente com feedback visual</li>
              <li>• Use a <strong>busca</strong> para filtrar negócios rapidamente</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Resumo geral */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Resumo Geral</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{negocios.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total de Negócios</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(negocios.reduce((sum, n) => sum + (n.valor_oferta || 0), 0))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Valor Total</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(negocios.reduce((sum, n) => sum + (n.valor_oferta || 0), 0) / (negocios.length || 1))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Ticket Médio</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {etapas.reduce((max, etapa) => {
                const count = getNegociosPorEtapa(etapa.nome).length
                return count > max.count ? { nome: etapa.nome, count } : max
              }, { nome: '', count: 0 }).nome.split(' ')[0]}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Etapa + Ativa</div>
          </div>
        </div>
      </div>

      {/* Modal de Configuração de Etapas */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">⚙️ Configurar Etapas do Funil</h3>
              <button
                onClick={cancelarEdicao}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Dica:</strong> Você pode adicionar, remover, renomear e reordenar as etapas. 
                  As alterações afetarão todos os negócios existentes.
                </p>
              </div>

              {editingEtapas.map((etapa, index) => (
                <div key={etapa.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600">
                  <div className="flex items-start gap-4">
                    {/* Botões de reordenação */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moverEtapa(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para cima"
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={() => moverEtapa(index, 'down')}
                        disabled={index === editingEtapas.length - 1}
                        className="text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover para baixo"
                      >
                        ⬇️
                      </button>
                    </div>

                    <div className="flex-1 space-y-3">
                      {/* Nome da etapa */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nome da Etapa
                        </label>
                        <input
                          type="text"
                          value={etapa.nome}
                          onChange={(e) => atualizarEtapa(etapa.id, 'nome', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Negociação, Fechamento..."
                        />
                      </div>

                      {/* Descrição/Tooltip */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Descrição (tooltip)
                        </label>
                        <input
                          type="text"
                          value={etapa.tooltip}
                          onChange={(e) => atualizarEtapa(etapa.id, 'tooltip', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Breve descrição da etapa"
                        />
                      </div>

                      {/* Seletor de cor */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Cor da Coluna
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {coresDisponiveis.map((corOpcao) => (
                            <button
                              key={corOpcao.nome}
                              onClick={() => {
                                atualizarEtapa(etapa.id, 'cor', corOpcao.cor)
                                atualizarEtapa(etapa.id, 'corHover', corOpcao.corHover)
                              }}
                              className={`px-3 py-2 rounded-lg border-2 transition-all ${corOpcao.cor} ${
                                etapa.cor === corOpcao.cor 
                                  ? 'ring-2 ring-blue-500 scale-110' 
                                  : 'hover:scale-105'
                              }`}
                              title={corOpcao.nome}
                            >
                              <span className="text-xs font-medium text-gray-800">{corOpcao.nome}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Botão remover */}
                    <button
                      onClick={() => removerEtapa(etapa.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2"
                      title="Remover etapa"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Contador de negócios */}
                  <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📊 <strong>{negocios.filter(n => n.etapa === etapa.nome).length}</strong> negócio(s) nesta etapa
                    </p>
                  </div>
                </div>
              ))}

              {/* Botão adicionar nova etapa */}
              <button
                onClick={adicionarEtapa}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all font-medium"
              >
                ➕ Adicionar Nova Etapa
              </button>
            </div>

            {/* Botões de ação */}
            <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={cancelarEdicao}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEtapas}
                disabled={updating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Funil
