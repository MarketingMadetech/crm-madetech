import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

function Lembretes() {
  const [retornos, setRetornos] = useState({ atrasados: [], hoje: [], proximos: [] })
  const [loading, setLoading] = useState(true)
  const [realizandoId, setRealizandoId] = useState(null)
  const [modalRetorno, setModalRetorno] = useState(null)
  const [realizarData, setRealizarData] = useState({
    observacao_retorno: '',
    criar_ocorrencia: true,
    agendar_novo: false,
    nova_data: '',
    nova_descricao: ''
  })

  useEffect(() => {
    loadRetornos()
  }, [])

  const loadRetornos = async () => {
    try {
      setLoading(true)
      const res = await api.get('/retornos/pendentes')
      setRetornos(res.data)
    } catch (error) {
      console.error('Erro ao carregar retornos:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularTempoRestante = (dataAgendada) => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataRetorno = new Date(dataAgendada + 'T00:00:00')
    const diffMs = dataRetorno - hoje
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDias < 0) {
      const diasAtrasado = Math.abs(diffDias)
      return {
        texto: diasAtrasado === 1 ? '1 dia atrasado' : `${diasAtrasado} dias atrasado`,
        classe: 'text-red-600 font-bold',
        icon: '🔴'
      }
    } else if (diffDias === 0) {
      return { texto: 'HOJE', classe: 'text-amber-600 font-bold', icon: '🟡' }
    } else if (diffDias === 1) {
      return { texto: 'Amanhã', classe: 'text-blue-600 font-semibold', icon: '🔵' }
    } else if (diffDias <= 7) {
      return { texto: `em ${diffDias} dias`, classe: 'text-blue-500', icon: '🔵' }
    } else {
      return { texto: `em ${diffDias} dias`, classe: 'text-gray-500', icon: '⚪' }
    }
  }

  const formatarData = (dataStr) => {
    if (!dataStr) return ''
    const data = new Date(dataStr + 'T00:00:00')
    return data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  }

  const formatarValor = (valor) => {
    if (!valor) return '-'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  const handleRealizarRetorno = async () => {
    if (!modalRetorno) return
    try {
      setRealizandoId(modalRetorno.id)
      await api.put(`/retornos/${modalRetorno.id}/realizar`, {
        observacao_retorno: realizarData.observacao_retorno,
        criar_ocorrencia: realizarData.criar_ocorrencia
      })
      if (realizarData.agendar_novo && realizarData.nova_data) {
        await api.post(`/negocios/${modalRetorno.negocio_id}/retornos`, {
          data_agendada: realizarData.nova_data,
          descricao: realizarData.nova_descricao || 'Retorno agendado'
        })
      }
      setModalRetorno(null)
      setRealizarData({ observacao_retorno: '', criar_ocorrencia: true, agendar_novo: false, nova_data: '', nova_descricao: '' })
      loadRetornos()
    } catch (error) {
      console.error('Erro ao realizar retorno:', error)
      alert('Erro ao marcar retorno como realizado')
    } finally {
      setRealizandoId(null)
    }
  }

  const handleDeleteRetorno = async (id) => {
    if (!confirm('Tem certeza que deseja apagar este retorno agendado?')) return
    try {
      await api.delete(`/retornos/${id}`)
      loadRetornos()
    } catch (error) {
      console.error('Erro ao apagar retorno:', error)
      alert('Erro ao apagar retorno')
    }
  }

  const totalPendentes = retornos.atrasados.length + retornos.hoje.length + retornos.proximos.length

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Carregando retornos...</p>
        </div>
      </div>
    )
  }

  const RetornoCard = ({ retorno }) => {
    const tempo = calcularTempoRestante(retorno.data_agendada)
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{tempo.icon}</span>
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{retorno.empresa}</h3>
              <span className={`text-sm ${tempo.classe}`}>{tempo.texto}</span>
            </div>
            {retorno.descricao && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">📝 {retorno.descricao}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              <span>📅 {formatarData(retorno.data_agendada)}</span>
              {retorno.pessoa_contato && <span>👤 {retorno.pessoa_contato}</span>}
              {retorno.telefone && <span>📞 {retorno.telefone}</span>}
              {retorno.valor_oferta > 0 && <span className="text-green-600 font-medium">💰 {formatarValor(retorno.valor_oferta)}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {retorno.equipamento && <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">{retorno.equipamento}</span>}
              {retorno.etapa && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">{retorno.etapa}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => setModalRetorno(retorno)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors whitespace-nowrap">✓ Realizado</button>
            <Link to={`/negocios/${retorno.negocio_id}/editar`} className="px-3 py-1.5 text-sm text-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Abrir</Link>
            <button onClick={() => handleDeleteRetorno(retorno.id)} className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Apagar retorno">🗑️</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          📅 Retornos Agendados
          {totalPendentes > 0 && <span className="text-lg bg-blue-600 text-white px-3 py-1 rounded-full">{totalPendentes}</span>}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Clientes aguardando seu contato</p>
      </div>

      {totalPendentes > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`rounded-lg p-4 text-center ${retornos.atrasados.length > 0 ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-300' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <div className="text-3xl font-bold text-red-600">{retornos.atrasados.length}</div>
            <div className="text-sm text-red-700 dark:text-red-400">Atrasados</div>
          </div>
          <div className={`rounded-lg p-4 text-center ${retornos.hoje.length > 0 ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <div className="text-3xl font-bold text-amber-600">{retornos.hoje.length}</div>
            <div className="text-sm text-amber-700 dark:text-amber-400">Para Hoje</div>
          </div>
          <div className="rounded-lg p-4 text-center bg-blue-100 dark:bg-blue-900/30">
            <div className="text-3xl font-bold text-blue-600">{retornos.proximos.length}</div>
            <div className="text-sm text-blue-700 dark:text-blue-400">Próximos</div>
          </div>
        </div>
      )}

      {totalPendentes === 0 && (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Nenhum retorno pendente!</h2>
          <p className="text-gray-500 dark:text-gray-400">Todos os retornos foram realizados.</p>
        </div>
      )}

      {retornos.atrasados.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-3">🔴 Atrasados ({retornos.atrasados.length})</h2>
          <div className="space-y-3">{retornos.atrasados.map(r => <RetornoCard key={r.id} retorno={r} />)}</div>
        </div>
      )}

      {retornos.hoje.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-3">🟡 Para Hoje ({retornos.hoje.length})</h2>
          <div className="space-y-3">{retornos.hoje.map(r => <RetornoCard key={r.id} retorno={r} />)}</div>
        </div>
      )}

      {retornos.proximos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-3">🔵 Próximos ({retornos.proximos.length})</h2>
          <div className="space-y-3">{retornos.proximos.map(r => <RetornoCard key={r.id} retorno={r} />)}</div>
        </div>
      )}

      {modalRetorno && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">✅ Marcar Retorno como Realizado</h3>
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">{modalRetorno.empresa}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">📅 {formatarData(modalRetorno.data_agendada)}{modalRetorno.descricao && ` • ${modalRetorno.descricao}`}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">O que aconteceu? (opcional)</label>
                <textarea value={realizarData.observacao_retorno} onChange={(e) => setRealizarData(prev => ({ ...prev, observacao_retorno: e.target.value }))} placeholder="Ex: Cliente confirmou interesse..." rows="2" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={realizarData.criar_ocorrencia} onChange={(e) => setRealizarData(prev => ({ ...prev, criar_ocorrencia: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Registrar como ocorrência no histórico</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={realizarData.agendar_novo} onChange={(e) => setRealizarData(prev => ({ ...prev, agendar_novo: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Cliente pediu para ligar novamente</span>
              </label>
              {realizarData.agendar_novo && (
                <div className="pl-6 space-y-3 border-l-2 border-blue-300 ml-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quando retornar? *</label>
                    <input type="date" value={realizarData.nova_data} onChange={(e) => setRealizarData(prev => ({ ...prev, nova_data: e.target.value }))} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo</label>
                    <input type="text" value={realizarData.nova_descricao} onChange={(e) => setRealizarData(prev => ({ ...prev, nova_descricao: e.target.value }))} placeholder="Ex: Aguardando aprovação" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setModalRetorno(null); setRealizarData({ observacao_retorno: '', criar_ocorrencia: true, agendar_novo: false, nova_data: '', nova_descricao: '' }) }} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
              <button onClick={handleRealizarRetorno} disabled={realizandoId === modalRetorno.id || (realizarData.agendar_novo && !realizarData.nova_data)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">{realizandoId === modalRetorno.id ? '⏳ Salvando...' : '✓ Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Lembretes
