import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import * as XLSX from 'xlsx'
import NegocioModal from '../components/NegocioModal'
import EmailModal from '../components/EmailModal'
import cacheService from '../utils/cacheService'
import EQUIPAMENTOS from '../config/equipamentos'
import { formatarDataBrasileira } from '../utils/dateUtils'

// Componente de Progresso de Recategorização
const ProgressoRecategorizacao = ({ negocios }) => {
  const etapasNovas = ['Contato Inicial', 'Cliente Contatado', 'Proposta Enviada', 'Prospecção']
  const statusNovos = ['Em Andamento', 'Parado', 'Perdido', 'Venda Confirmada', 'Encerrado', 'Suspenso']

  const totalNegocios = negocios.length
  const etapasAtualizadas = negocios.filter(n => etapasNovas.includes(n.etapa)).length
  const statusAtualizados = negocios.filter(n => statusNovos.includes(n.status)).length

  const percentualEtapa = totalNegocios > 0 ? (etapasAtualizadas / totalNegocios * 100).toFixed(1) : 0
  const percentualStatus = totalNegocios > 0 ? (statusAtualizados / totalNegocios * 100).toFixed(1) : 0

  const totalPendentes = totalNegocios - Math.min(etapasAtualizadas, statusAtualizados)

  if (totalPendentes === 0) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            📊 Progresso de Recategorização
          </h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300">Etapa</span>
                <span className="font-semibold text-gray-900 dark:text-white">{etapasAtualizadas}/{totalNegocios} ({percentualEtapa}%)</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentualEtapa}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 dark:text-gray-300">Status</span>
                <span className="font-semibold text-gray-900 dark:text-white">{statusAtualizados}/{totalNegocios} ({percentualStatus}%)</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentualStatus}%` }}
                ></div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <span>⚠️</span>
            <span><strong>{totalPendentes}</strong> negócios ainda precisam ser atualizados</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// Componente para mostrar última atividade
const UltimaAtividade = ({ negocioId }) => {
  const [atividade, setAtividade] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregarAtividade = async () => {
      try {
        const res = await api.get(`/historico/${negocioId}`)
        if (res.data && res.data.length > 0) {
          setAtividade(res.data[0]) // Pega a mais recente
        }
      } catch (error) {
        console.error('Erro ao carregar atividade:', error)
      } finally {
        setLoading(false)
      }
    }
    carregarAtividade()
  }, [negocioId])

  if (loading) {
    return <span className="text-gray-400 text-xs">...</span>
  }

  if (!atividade) {
    return <span className="text-gray-400 text-xs">Sem atividade</span>
  }

  const icone = atividade.tipo_acao === 'criacao' ? '🆕' : 
               atividade.tipo_acao === 'atualizacao' ? '✏️' : '📝'
  
  const textoAcao = atividade.tipo_acao === 'criacao' ? 'Criado' : 
                   atividade.tipo_acao === 'atualizacao' ? `${atividade.campo_alterado} alterado` : 
                   'Atividade'

  const dataFormatada = new Date(atividade.data_hora).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="text-xs">
      <div className="flex items-center gap-1 text-gray-600">
        <span>{icone}</span>
        <span className="font-medium">{textoAcao}</span>
      </div>
      <div className="text-gray-400 mt-0.5">{dataFormatada}</div>
    </div>
  )
}

function Negocios() {
  const [negocios, setNegocios] = useState([])
  const [filtros, setFiltros] = useState({})
  const [filtroAtivo, setFiltroAtivo] = useState({
    status: '',
    etapa: '',
    origem: '',
    equipamento: '',
    search: '',
    dataInicio: '',
    dataFim: ''
  })
  const [loading, setLoading] = useState(true)
  const [negocioSelecionado, setNegocioSelecionado] = useState(null)
  const [ordenacao, setOrdenacao] = useState({ campo: 'data_criacao', direcao: 'desc' })
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina] = useState(50)
  const [filtroData, setFiltroData] = useState('')
  const [selecionados, setSelecionados] = useState([])
  const [mostrarAcoesMassa, setMostrarAcoesMassa] = useState(false)
  const [emailNegocio, setEmailNegocio] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deletando, setDeletando] = useState(false)

  // Helper para formatar datas SQL para formato brasileiro (importado de dateUtils)
  const formatarData = formatarDataBrasileira

  // Helper para converter data para objeto Date
  const parseData = (dataStr) => {
    if (!dataStr) return null
    // Formato SQL: 2025-11-05 00:00:00
    if (dataStr.includes('-')) {
      return new Date(dataStr.split(' ')[0])
    }
    // Formato brasileiro: 05/11/2025
    const [dia, mes, ano] = dataStr.split('/')
    return new Date(ano, mes - 1, dia)
  }

  useEffect(() => {
    loadFiltros()
    loadNegocios()
  }, [])

  const loadFiltros = useCallback(async () => {
    try {
      // Verifica cache
      const cached = cacheService.get('filtros')
      if (cached) {
        setFiltros(cached)
        return
      }

      const res = await api.get('/filtros')
      cacheService.set('filtros', res.data, 10 * 60 * 1000) // 10 min cache
      setFiltros(res.data)
    } catch (error) {
      console.error('Erro ao carregar filtros:', error)
    }
  }, [])

  const loadNegocios = useCallback(async (params = {}, forceRefresh = false) => {
    try {
      setLoading(true)
      
      // Cria chave de cache baseada nos parâmetros
      const cacheKey = `negocios:${JSON.stringify(params)}`
      
      // Se não forçar refresh, verifica cache
      if (!forceRefresh && cacheService.has(cacheKey)) {
        setNegocios(cacheService.get(cacheKey))
        setLoading(false)
        return
      }

      console.log('[Negocios] Buscando negócios com params:', params)
      const res = await api.get('/negocios', { params })
      console.log('[Negocios] Resposta da API:', res.data)
      cacheService.set(cacheKey, res.data)
      setNegocios(res.data)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar negócios:', error)
      setLoading(false)
    }
  }, [])

  const handleFiltroChange = (field, value) => {
    const newFiltro = { ...filtroAtivo, [field]: value }
    setFiltroAtivo(newFiltro)
    setPaginaAtual(1)
    loadNegocios(newFiltro)
  }

  const handleOrdenar = (campo) => {
    const novaDirecao = ordenacao.campo === campo && ordenacao.direcao === 'asc' ? 'desc' : 'asc'
    setOrdenacao({ campo, direcao: novaDirecao })
  }

  const aplicarFiltroData = (periodo) => {
    setFiltroData(periodo)
    setPaginaAtual(1)
  }

  const filtrarPorData = (negocios) => {
    // Filtro por período personalizado (dataInicio e dataFim)
    if (filtroAtivo.dataInicio || filtroAtivo.dataFim) {
      return negocios.filter(n => {
        if (!n.data_criacao) return false
        const dataCriacao = parseData(n.data_criacao)
        if (!dataCriacao) return false
        
        const dataInicio = filtroAtivo.dataInicio ? new Date(filtroAtivo.dataInicio) : null
        const dataFim = filtroAtivo.dataFim ? new Date(filtroAtivo.dataFim) : null
        
        if (dataInicio && dataCriacao < dataInicio) return false
        if (dataFim && dataCriacao > dataFim) return false
        
        return true
      })
    }

    // Filtro por período rápido
    if (!filtroData) return negocios

    const hoje = new Date()
    const dataLimite = new Date()

    switch(filtroData) {
      case 'ultimos7':
        dataLimite.setDate(hoje.getDate() - 7)
        break
      case 'ultimos30':
        dataLimite.setDate(hoje.getDate() - 30)
        break
      case 'esteMes':
        dataLimite.setDate(1)
        break
      case 'esteAno':
        dataLimite.setMonth(0, 1)
        break
      default:
        return negocios
    }

    return negocios.filter(n => {
      if (!n.data_criacao) return false
      const dataCriacao = parseData(n.data_criacao)
      return dataCriacao && dataCriacao >= dataLimite
    })
  }
  
  const filtrarPorEquipamento = (negocios) => {
    if (!filtroAtivo.equipamento) return negocios
    return negocios.filter(n => n.equipamento === filtroAtivo.equipamento)
  }

  const ordenarNegocios = (negocios) => {
    return [...negocios].sort((a, b) => {
      let valorA = a[ordenacao.campo]
      let valorB = b[ordenacao.campo]

      // Tratar valores nulos
      if (valorA === null || valorA === undefined) return 1
      if (valorB === null || valorB === undefined) return -1

      // Ordenar datas
      if (ordenacao.campo === 'data_criacao' || ordenacao.campo === 'data_fechamento') {
        if (!valorA) return 1
        if (!valorB) return -1
        valorA = parseData(valorA)
        valorB = parseData(valorB)
        if (!valorA) return 1
        if (!valorB) return -1
      }

      // Ordenar strings
      if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase()
        valorB = valorB.toLowerCase()
      }

      if (ordenacao.direcao === 'asc') {
        return valorA > valorB ? 1 : -1
      } else {
        return valorA < valorB ? 1 : -1
      }
    })
  }

  // Aplicar filtros, ordenação e paginação
  const negociosFiltradosPorData = filtrarPorData(negocios)
  const negociosFiltradosPorEquipamento = filtrarPorEquipamento(negociosFiltradosPorData)
  const negociosOrdenados = ordenarNegocios(negociosFiltradosPorEquipamento)
  const totalPaginas = Math.ceil(negociosOrdenados.length / itensPorPagina)
  const indiceInicio = (paginaAtual - 1) * itensPorPagina
  const indiceFim = indiceInicio + itensPorPagina
  const negociosPaginados = negociosOrdenados.slice(indiceInicio, indiceFim)

  const limparFiltros = () => {
    setFiltroAtivo({ status: '', etapa: '', origem: '', equipamento: '', search: '', dataInicio: '', dataFim: '' })
    setFiltroData('')
    setPaginaAtual(1)
    loadNegocios({}, true) // Force refresh
  }

  const deletarNegocio = async (id) => {
    setDeletando(true)
    try {
      await api.delete(`/negocios/${id}`)
      setConfirmDelete(null)
      
      // Invalida todo cache relacionado a negócios
      cacheService.clearPattern('^negocios:')
      
      loadNegocios(filtroAtivo, true)
      alert('Negócio deletado com sucesso!')
    } catch (error) {
      console.error('Erro ao deletar:', error)
      alert('Erro ao deletar negócio')
    } finally {
      setDeletando(false)
    }
  }

  const toggleSelecionado = (id) => {
    setSelecionados(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleTodos = () => {
    if (selecionados.length === negociosPaginados.length) {
      setSelecionados([])
    } else {
      setSelecionados(negociosPaginados.map(n => n.id))
    }
  }

  const aplicarAcaoMassa = async (campo, valor) => {
    if (selecionados.length === 0) {
      alert('Selecione ao menos um negócio')
      return
    }

    if (!confirm(`Atualizar ${selecionados.length} negócio(s)?`)) return

    try {
      for (const id of selecionados) {
        const negocio = negocios.find(n => n.id === id)
        await api.put(`/negocios/${id}`, {
          ...negocio,
          [campo]: valor
        })
      }
      
      setSelecionados([])
      setMostrarAcoesMassa(false)
      
      // Invalida cache
      cacheService.clearPattern('^negocios:')
      
      loadNegocios(filtroAtivo, true)
      alert('Negócios atualizados com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar:', error)
      alert('Erro ao atualizar negócios')
    }
  }

  const abrirWhatsApp = (negocio) => {
    if (!negocio.telefone) {
      alert('Telefone não cadastrado para este contato')
      return
    }
    
    // Limpar telefone (remover caracteres especiais)
    const telefone = negocio.telefone.replace(/\D/g, '')
    
    const texto = `Olá ${negocio.pessoa_contato || 'cliente'},\n\nEm relação ao negócio de ${negocio.equipamento || 'equipamento'}...`
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')
  }

  const abrirEmail = (negocio) => {
    if (!negocio.email) {
      alert('Email não cadastrado para este contato')
      return
    }
    
    const assunto = `Negócio: ${negocio.equipamento || 'Equipamento'} - ${negocio.empresa}`
    const corpo = `Olá ${negocio.pessoa_contato || 'cliente'},\n\nEm relação ao negócio de ${negocio.equipamento || 'equipamento'}...`
    
    const mailto = `mailto:${negocio.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`
    window.location.href = mailto
  }

  const formatCurrency = (value) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusColor = (status) => {
    const colors = {
      'Venda Confirmada': 'bg-green-100 text-green-900',
      'Em andamento': 'bg-blue-100 text-blue-900',
      'Perdido': 'bg-red-100 text-red-900',
      'Suspenso': 'bg-yellow-100 text-yellow-900',
      'Cancelado': 'bg-gray-200 text-gray-900',
      'Proposta enviada': 'bg-purple-100 text-purple-900',
      'Parado': 'bg-orange-100 text-orange-900'
    }
    return colors[status] || 'bg-gray-200 text-gray-900'
  }

  const exportarExcel = () => {
    const dadosExport = negociosFiltrados.map(n => ({
      'Empresa': n.empresa,
      'Pessoa de Contato': n.pessoa_contato || '',
      'Equipamento': n.equipamento || '',
      'Tipo da Máquina': n.tipo_maquina || '',
      'Tipo Negociação': n.tipo_negociacao || '',
      'Valor Produto': n.valor_produto || 0,
      'Valor Oferta': n.valor_oferta || 0,
      'Valor Fábrica': n.valor_fabrica || 0,
      'Valor Brasil': n.valor_brasil || 0,
      'Data Criação': formatarData(n.data_criacao),
      'Data Fechamento': formatarData(n.data_fechamento),
      'Etapa': n.etapa || '',
      'Status': n.status || '',
      'Origem': n.origem || '',
      'Observações': n.observacao || ''
    }))

    const ws = XLSX.utils.json_to_sheet(dadosExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Negócios')
    
    const fileName = `CRM_Negocios_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-4 py-5 sm:px-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Negócios</h2>
          <div className="flex items-center gap-3 mt-2">
            {selecionados.length > 0 && (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {selecionados.length} negócio(s) selecionado(s)
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              📊 {negociosOrdenados.length} de {negocios.length} negócios
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {selecionados.length > 0 && (
            <button
              onClick={() => setMostrarAcoesMassa(!mostrarAcoesMassa)}
              className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md shadow-sm text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              ⚡ Ações em Massa
            </button>
          )}
          <button
            onClick={exportarExcel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            📊 Exportar Excel
          </button>
          <Link
            to="/negocios/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            + Novo Negócio
          </Link>
        </div>
      </div>

      {/* Ações em Massa */}
      {mostrarAcoesMassa && selecionados.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mx-4">
          <h3 className="font-semibold text-blue-900 mb-3">Ações em Massa ({selecionados.length} selecionados)</h3>
          <div className="flex gap-3 flex-wrap">
            <select
              onChange={(e) => e.target.value && aplicarAcaoMassa('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              defaultValue=""
            >
              <option value="">Alterar Status</option>
              {filtros.status?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            <select
              onChange={(e) => e.target.value && aplicarAcaoMassa('etapa', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              defaultValue=""
            >
              <option value="">Alterar Etapa</option>
              {filtros.etapas?.map(e => <option key={e} value={e}>{e}</option>)}
            </select>

            <button
              onClick={() => {
                setSelecionados([])
                setMostrarAcoesMassa(false)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Indicador de Progresso de Recategorização */}
      <ProgressoRecategorizacao negocios={negocios} />

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filtros</h3>
        
        {/* Filtros de Data Rápidos */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => aplicarFiltroData('')}
            className={`px-3 py-1 text-sm rounded-full ${!filtroData ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Todos
          </button>
          <button
            onClick={() => aplicarFiltroData('ultimos7')}
            className={`px-3 py-1 text-sm rounded-full ${filtroData === 'ultimos7' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => aplicarFiltroData('ultimos30')}
            className={`px-3 py-1 text-sm rounded-full ${filtroData === 'ultimos30' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Últimos 30 dias
          </button>
          <button
            onClick={() => aplicarFiltroData('esteMes')}
            className={`px-3 py-1 text-sm rounded-full ${filtroData === 'esteMes' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Este mês
          </button>
          <button
            onClick={() => aplicarFiltroData('esteAno')}
            className={`px-3 py-1 text-sm rounded-full ${filtroData === 'esteAno' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Este ano
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Empresa, contato, equipamento..."
              value={filtroAtivo.search}
              onChange={(e) => handleFiltroChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={filtroAtivo.status}
              onChange={(e) => handleFiltroChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {filtros.status?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etapa</label>
            <select
              value={filtroAtivo.etapa}
              onChange={(e) => handleFiltroChange('etapa', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {filtros.etapas?.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origem</label>
            <select
              value={filtroAtivo.origem}
              onChange={(e) => handleFiltroChange('origem', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {filtros.origens?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Nova linha de filtros: Equipamento e Datas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">🔧 Equipamento</label>
            <select
              value={filtroAtivo.equipamento}
              onChange={(e) => handleFiltroChange('equipamento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os equipamentos</option>
              {EQUIPAMENTOS.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">📅 Data Início</label>
            <input
              type="date"
              value={filtroAtivo.dataInicio}
              onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">📅 Data Fim</label>
            <input
              type="date"
              value={filtroAtivo.dataFim}
              onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Badges de filtros ativos e botão limpar */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            {filtroAtivo.status && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Status: {filtroAtivo.status}
                <button onClick={() => handleFiltroChange('status', '')} className="hover:text-blue-600">✕</button>
              </span>
            )}
            {filtroAtivo.etapa && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Etapa: {filtroAtivo.etapa}
                <button onClick={() => handleFiltroChange('etapa', '')} className="hover:text-purple-600">✕</button>
              </span>
            )}
            {filtroAtivo.origem && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Origem: {filtroAtivo.origem}
                <button onClick={() => handleFiltroChange('origem', '')} className="hover:text-green-600">✕</button>
              </span>
            )}
            {filtroAtivo.equipamento && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                🔧 {filtroAtivo.equipamento}
                <button onClick={() => handleFiltroChange('equipamento', '')} className="hover:text-orange-600">✕</button>
              </span>
            )}
            {filtroAtivo.dataInicio && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                📅 Início: {new Date(filtroAtivo.dataInicio).toLocaleDateString('pt-BR')}
                <button onClick={() => handleFiltroChange('dataInicio', '')} className="hover:text-yellow-600">✕</button>
              </span>
            )}
            {filtroAtivo.dataFim && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                📅 Fim: {new Date(filtroAtivo.dataFim).toLocaleDateString('pt-BR')}
                <button onClick={() => handleFiltroChange('dataFim', '')} className="hover:text-yellow-600">✕</button>
              </span>
            )}
            {filtroData && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                Período rápido
                <button onClick={() => aplicarFiltroData('')} className="hover:text-indigo-600">✕</button>
              </span>
            )}
          </div>
          
          {(filtroAtivo.status || filtroAtivo.etapa || filtroAtivo.origem || filtroAtivo.equipamento || filtroAtivo.dataInicio || filtroAtivo.dataFim || filtroData) && (
            <button
              onClick={limparFiltros}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              🗑️ Limpar todos os filtros
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : negocios.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum negócio encontrado</div>
        ) : (
          <div className="relative">
            {/* Indicador visual de scroll horizontal */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-blue-50 dark:from-gray-700 to-transparent pointer-events-none z-10"></div>
            
            <div className="overflow-x-auto">
              {/* Indicador de "scroll para a direita" */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none">
                <div className="animate-bounce text-gray-400 dark:text-gray-500">→</div>
              </div>
              
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selecionados.length === negociosPaginados.length && negociosPaginados.length > 0}
                      onChange={toggleTodos}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th 
                    onClick={() => handleOrdenar('empresa')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Empresa
                      {ordenacao.campo === 'empresa' && (
                        <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                  onClick={() => handleOrdenar('pessoa_contato')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                  <div className="flex items-center gap-1">
                  Contato
                  {ordenacao.campo === 'pessoa_contato' && (
                  <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                  )}
                  </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                  </th>
                  <th 
                  onClick={() => handleOrdenar('equipamento')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                  <div className="flex items-center gap-1">
                  Equipamento
                    {ordenacao.campo === 'equipamento' && (
                        <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleOrdenar('valor_oferta')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Valor Oferta
                      {ordenacao.campo === 'valor_oferta' && (
                        <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleOrdenar('etapa')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Etapa
                      {ordenacao.campo === 'etapa' && (
                        <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleOrdenar('status')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {ordenacao.campo === 'status' && (
                        <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleOrdenar('data_criacao')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Data Criação
                      {ordenacao.campo === 'data_criacao' && (
                        <span>{ordenacao.direcao === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Atividade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observações</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {negociosPaginados.map((negocio) => (
                  <tr key={negocio.id} className={`hover:bg-gray-50 ${selecionados.includes(negocio.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selecionados.includes(negocio.id)}
                        onChange={() => toggleSelecionado(negocio.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => setNegocioSelecionado(negocio)}
                    >
                      {negocio.empresa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{negocio.pessoa_contato || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {negocio.telefone ? (
                        <a href={`tel:${negocio.telefone}`} className="hover:underline">
                          {negocio.telefone}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {negocio.email ? (
                        <a href={`mailto:${negocio.email}`} className="hover:underline">
                          {negocio.email}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{negocio.equipamento || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(negocio.valor_oferta)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{negocio.etapa || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(negocio.status)}`}>
                        {negocio.status || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatarData(negocio.data_criacao)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <UltimaAtividade negocioId={negocio.id} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <div className="truncate" title={negocio.observacao || '-'}>
                        {negocio.observacao || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirWhatsApp(negocio)}
                          className="text-green-600 hover:text-green-900"
                          title="WhatsApp"
                        >
                          📱
                        </button>
                        <button
                          onClick={() => abrirEmail(negocio)}
                          className="text-blue-600 hover:text-blue-900"
                          title="E-mail"
                        >
                          ✉️
                        </button>
                        <Link to={`/negocios/${negocio.id}/editar`} className="text-gray-600 hover:text-gray-900">
                          ✏️
                        </Link>
                        <button
                          onClick={() => setConfirmDelete(negocio)}
                          className="text-red-600 hover:text-red-900"
                          title="Deletar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Paginação */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
            disabled={paginaAtual === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaAtual === totalPaginas}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{indiceInicio + 1}</span> a{' '}
              <span className="font-medium">{Math.min(indiceFim, negociosOrdenados.length)}</span> de{' '}
              <span className="font-medium">{negociosOrdenados.length}</span> resultados
              {filtroData && <span className="text-blue-600"> (filtrado)</span>}
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                ← Anterior
              </button>
              
              {[...Array(totalPaginas)].map((_, i) => {
                const numeroPagina = i + 1
                // Mostrar apenas algumas páginas
                if (
                  numeroPagina === 1 ||
                  numeroPagina === totalPaginas ||
                  (numeroPagina >= paginaAtual - 1 && numeroPagina <= paginaAtual + 1)
                ) {
                  return (
                    <button
                      key={numeroPagina}
                      onClick={() => setPaginaAtual(numeroPagina)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        paginaAtual === numeroPagina
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {numeroPagina}
                    </button>
                  )
                } else if (
                  numeroPagina === paginaAtual - 2 ||
                  numeroPagina === paginaAtual + 2
                ) {
                  return <span key={numeroPagina} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
                }
                return null
              })}
              
              <button
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Próxima →
              </button>
            </nav>
          </div>
        </div>
      </div>

      {negocioSelecionado && (
        <NegocioModal 
          negocio={negocioSelecionado} 
          onClose={() => setNegocioSelecionado(null)} 
        />
      )}

      {emailNegocio && (
        <EmailModal 
          negocio={emailNegocio} 
          onClose={() => setEmailNegocio(null)} 
          onEnviado={() => loadNegocios(filtroAtivo)} 
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ⚠️ Deletar Negócio
            </h3>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja deletar o negócio de <strong>{confirmDelete.empresa}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deletando}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => deletarNegocio(confirmDelete.id)}
                disabled={deletando}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {deletando ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    Deletando...
                  </>
                ) : (
                  '🗑️ Deletar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Negocios
