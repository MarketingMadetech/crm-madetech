import React, { useState, useEffect } from 'react'
import api from '../utils/api'

function RetornosAgendados({ negocioId, onRetornoRealizado }) {
  const [retornos, setRetornos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showRealizarModal, setShowRealizarModal] = useState(null)
  const [novoRetorno, setNovoRetorno] = useState({
    data_agendada: '',
    descricao: ''
  })
  const [realizarData, setRealizarData] = useState({
    observacao_retorno: '',
    criar_ocorrencia: true,
    agendar_novo: false,
    nova_data: '',
    nova_descricao: ''
  })

  useEffect(() => {
    if (negocioId) {
      loadRetornos()
    }
  }, [negocioId])

  const loadRetornos = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/negocios/${negocioId}/retornos`)
      setRetornos(res.data)
    } catch (error) {
      console.error('Erro ao carregar retornos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddRetorno = async (e) => {
    e.preventDefault()
    if (!novoRetorno.data_agendada) {
      alert('Selecione uma data para o retorno')
      return
    }

    try {
      await api.post(`/negocios/${negocioId}/retornos`, novoRetorno)
      setNovoRetorno({ data_agendada: '', descricao: '' })
      setShowForm(false)
      loadRetornos()
    } catch (error) {
      console.error('Erro ao agendar retorno:', error)
      alert('Erro ao agendar retorno')
    }
  }

  const handleRealizarRetorno = async () => {
    if (!showRealizarModal) return

    try {
      await api.put(`/retornos/${showRealizarModal.id}/realizar`, {
        observacao_retorno: realizarData.observacao_retorno,
        criar_ocorrencia: realizarData.criar_ocorrencia
      })

      // Se quer agendar um novo retorno
      if (realizarData.agendar_novo && realizarData.nova_data) {
        await api.post(`/negocios/${negocioId}/retornos`, {
          data_agendada: realizarData.nova_data,
          descricao: realizarData.nova_descricao || 'Retorno agendado'
        })
      }

      setShowRealizarModal(null)
      setRealizarData({
        observacao_retorno: '',
        criar_ocorrencia: true,
        agendar_novo: false,
        nova_data: '',
        nova_descricao: ''
      })
      loadRetornos()
      
      // Notifica o componente pai para atualizar ocorrências
      if (onRetornoRealizado) {
        onRetornoRealizado()
      }
    } catch (error) {
      console.error('Erro ao realizar retorno:', error)
      alert('Erro ao marcar retorno como realizado')
    }
  }

  const handleDeleteRetorno = async (id) => {
    if (!confirm('Deseja realmente remover este agendamento de retorno?')) return

    try {
      await api.delete(`/retornos/${id}`)
      loadRetornos()
    } catch (error) {
      console.error('Erro ao deletar retorno:', error)
      alert('Erro ao remover retorno')
    }
  }

  const formatarData = (dataStr) => {
    if (!dataStr) return ''
    const data = new Date(dataStr + 'T00:00:00')
    return data.toLocaleDateString('pt-BR')
  }

  const getStatusRetorno = (dataAgendada) => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataRetorno = new Date(dataAgendada + 'T00:00:00')
    
    const diffDias = Math.floor((dataRetorno - hoje) / (1000 * 60 * 60 * 24))
    
    if (diffDias < 0) {
      return { 
        label: `${Math.abs(diffDias)} dia(s) atrasado`, 
        classe: 'bg-red-100 text-red-800 border-red-300',
        icon: '🔴'
      }
    } else if (diffDias === 0) {
      return { 
        label: 'HOJE', 
        classe: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: '🟡'
      }
    } else if (diffDias <= 7) {
      return { 
        label: `em ${diffDias} dia(s)`, 
        classe: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: '🔵'
      }
    } else {
      return { 
        label: `em ${diffDias} dias`, 
        classe: 'bg-gray-100 text-gray-700 border-gray-300',
        icon: '⚪'
      }
    }
  }

  const pendentes = retornos.filter(r => !r.realizado)
  const realizados = retornos.filter(r => r.realizado)

  if (loading) {
    return (
      <div className="text-center py-4 text-gray-500">
        Carregando retornos...
      </div>
    )
  }

  return (
    <div className="border-t pt-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          📅 Retornos Agendados
          {pendentes.length > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {pendentes.length} pendente{pendentes.length > 1 ? 's' : ''}
            </span>
          )}
        </h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
        >
          {showForm ? '✕ Cancelar' : '➕ Agendar Retorno'}
        </button>
      </div>

      {/* Formulário para novo retorno */}
      {showForm && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-green-800 dark:text-green-300 mb-3">Novo Retorno</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data do Retorno *
              </label>
              <input
                type="date"
                value={novoRetorno.data_agendada}
                onChange={(e) => setNovoRetorno(prev => ({ ...prev, data_agendada: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Ligar para confirmar interesse"
                value={novoRetorno.descricao}
                onChange={(e) => setNovoRetorno(prev => ({ ...prev, descricao: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddRetorno}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            ✓ Confirmar Agendamento
          </button>
        </div>
      )}

      {/* Lista de retornos pendentes */}
      {pendentes.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendentes</h4>
          {pendentes.map(retorno => {
            const status = getStatusRetorno(retorno.data_agendada)
            return (
              <div 
                key={retorno.id} 
                className={`flex items-center gap-3 p-3 rounded-lg border ${status.classe} group`}
              >
                <span className="text-lg">{status.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatarData(retorno.data_agendada)}</span>
                    <span className="text-xs opacity-75">({status.label})</span>
                  </div>
                  {retorno.descricao && (
                    <p className="text-sm mt-0.5 opacity-90">{retorno.descricao}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRealizarModal(retorno)}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    title="Marcar como realizado"
                  >
                    ✓ Realizado
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRetorno(retorno.id)}
                    className="px-2 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    title="Remover agendamento"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lista de retornos realizados */}
      {realizados.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>Histórico de Retornos</span>
            <span className="text-xs text-gray-400">({realizados.length})</span>
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {realizados.map(retorno => (
              <div 
                key={retorno.id} 
                className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-sm"
              >
                <span>✅</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="line-through">{formatarData(retorno.data_agendada)}</span>
                    {retorno.data_realizado && (
                      <span className="text-xs">
                        → realizado em {new Date(retorno.data_realizado).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  {retorno.descricao && (
                    <p className="text-xs opacity-75">{retorno.descricao}</p>
                  )}
                  {retorno.observacao_retorno && (
                    <p className="text-xs italic mt-1 text-green-600 dark:text-green-400">
                      "{retorno.observacao_retorno}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {retornos.length === 0 && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
          <span className="text-2xl mb-2 block">📅</span>
          <p>Nenhum retorno agendado</p>
          <p className="text-sm mt-1">Clique em "Agendar Retorno" para criar um lembrete</p>
        </div>
      )}

      {/* Modal para marcar retorno como realizado */}
      {showRealizarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              ✅ Marcar Retorno como Realizado
            </h3>
            
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Data agendada:</strong> {formatarData(showRealizarModal.data_agendada)}
              </p>
              {showRealizarModal.descricao && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  <strong>Descrição:</strong> {showRealizarModal.descricao}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observação do retorno (opcional)
                </label>
                <textarea
                  value={realizarData.observacao_retorno}
                  onChange={(e) => setRealizarData(prev => ({ ...prev, observacao_retorno: e.target.value }))}
                  placeholder="Ex: Cliente confirmou interesse, aguardando aprovação..."
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={realizarData.criar_ocorrencia}
                  onChange={(e) => setRealizarData(prev => ({ ...prev, criar_ocorrencia: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Criar ocorrência automaticamente
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={realizarData.agendar_novo}
                  onChange={(e) => setRealizarData(prev => ({ ...prev, agendar_novo: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Agendar um novo retorno
                </span>
              </label>

              {realizarData.agendar_novo && (
                <div className="pl-6 space-y-3 border-l-2 border-blue-300 ml-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nova data de retorno *
                    </label>
                    <input
                      type="date"
                      value={realizarData.nova_data}
                      onChange={(e) => setRealizarData(prev => ({ ...prev, nova_data: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrição do novo retorno
                    </label>
                    <input
                      type="text"
                      value={realizarData.nova_descricao}
                      onChange={(e) => setRealizarData(prev => ({ ...prev, nova_descricao: e.target.value }))}
                      placeholder="Ex: Retornar após reunião interna do cliente"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowRealizarModal(null)
                  setRealizarData({
                    observacao_retorno: '',
                    criar_ocorrencia: true,
                    agendar_novo: false,
                    nova_data: '',
                    nova_descricao: ''
                  })
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRealizarRetorno}
                disabled={realizarData.agendar_novo && !realizarData.nova_data}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                ✓ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RetornosAgendados
