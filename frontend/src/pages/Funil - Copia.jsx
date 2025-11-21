import React, { useState, useEffect } from 'react'
import axios from 'axios'

function Funil() {
  const [negocios, setNegocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [draggedItem, setDraggedItem] = useState(null)
  const [busca, setBusca] = useState("")

  const etapas = [
    { nome: 'Contato inicial', cor: 'bg-blue-100 border-blue-300', tooltip: 'Primeiro contato realizado com o cliente.' },
    { nome: 'Proposta enviada', cor: 'bg-yellow-100 border-yellow-300', tooltip: 'Proposta comercial enviada ao cliente.' },
    { nome: 'Cliente contatado', cor: 'bg-purple-100 border-purple-300', tooltip: 'Cliente respondeu ou foi contatado após proposta.' },
    { nome: 'Parado', cor: 'bg-gray-100 border-gray-300', tooltip: 'Negócio sem avanço recente ou aguardando ação.' }
  ]

  useEffect(() => {
    loadNegocios()
  }, [])

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
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, novaEtapa) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem.etapa === novaEtapa) {
      setDraggedItem(null)
      return
    }

    try {
      await axios.put(`/api/negocios/${draggedItem.id}`, {
        ...draggedItem,
        etapa: novaEtapa
      })
      
      setNegocios(prev => prev.map(n => 
        n.id === draggedItem.id ? { ...n, etapa: novaEtapa } : n
      ))
      
      setDraggedItem(null)
    } catch (error) {
      console.error('Erro ao atualizar etapa:', error)
      alert('Erro ao mover negócio')
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Funil de Vendas</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Arraste os cards entre as colunas para mudar a etapa</p>
      </div>

      {/* Campo de busca */}
      <div className="px-4 pb-2">
        <input
          type="text"
          className="w-full max-w-md border rounded px-3 py-2 text-sm"
          placeholder="Buscar por empresa, contato ou equipamento..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {etapas.map((etapa) => {
          const negociosEtapa = getNegociosPorEtapa(etapa.nome)
          const valorTotal = calcularValorTotal(etapa.nome)
          return (
            <div
              key={etapa.nome}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, etapa.nome)}
            >
              <div className={`rounded-lg border-2 ${etapa.cor} p-4 h-full`}>
                <div className="mb-4">
                  <h3 className="font-semibold !text-gray-900" title={etapa.tooltip}>{etapa.nome}</h3>
                  <div className="mt-1 text-sm !text-gray-800">
                    <span className="font-medium !text-gray-800">{negociosEtapa.length} negócio(s)</span>
                    <span className="mx-2">•</span>
                    <span className="font-semibold !text-gray-900">{formatCurrency(valorTotal)}</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {negociosEtapa.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-700 text-sm">
                      Nenhum negócio nesta etapa
                    </div>
                  ) : (
                    negociosEtapa.map((negocio) => (
                      <div
                        key={negocio.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, negocio)}
                        className={`bg-white rounded-lg shadow p-4 cursor-move hover:shadow-lg transition-shadow ${
                          draggedItem?.id === negocio.id ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900 mb-2">
                          {negocio.empresa}
                        </div>
                        {/* Ícone pessoa_contato com tooltip */}
                        {negocio.pessoa_contato && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span title="Pessoa de contato">
                              👤
                            </span> {negocio.pessoa_contato}
                          </div>
                        )}
                        {/* Ícone equipamento com tooltip */}
                        {negocio.equipamento && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span title="Equipamento de interesse">
                              🔧
                            </span> {negocio.equipamento}
                          </div>
                        )}
                        <div className="text-sm font-semibold text-blue-600 mt-3">
                          {formatCurrency(negocio.valor_oferta)}
                        </div>
                        {/* Ícone origem com tooltip */}
                        {negocio.origem && (
                          <div className="text-xs text-gray-500 mt-2 truncate">
                            <span title="Origem do lead">📍</span> {negocio.origem}
                          </div>
                        )}
                        {/* Ícone data_criacao com tooltip */}
                        {negocio.data_criacao && (
                          <div className="text-xs text-gray-400 mt-1">
                            <span title="Data de criação">📅</span> {negocio.data_criacao}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">💡</span>
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Dica</p>
            <p className="text-sm text-blue-700 dark:text-blue-200">
              Arraste os cards entre as colunas para atualizar a etapa do negócio automaticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Funil
