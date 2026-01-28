import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import * as XLSX from 'xlsx'

function Lembretes() {
  const [lembretes, setLembretes] = useState({
    aguardandoContato: [],
    propostaEnviada: [],
    parados: [],
    reativacao: [],
    proximoFechamento: [],
    semFechamento: []
  })
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('parados')
  const [busca, setBusca] = useState('')
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina] = useState(20)
  const [visualizacao, setVisualizacao] = useState('lista') // 'lista' ou 'calendario'
  const [mesAtual, setMesAtual] = useState(new Date())
  const [negociosPorData, setNegociosPorData] = useState({})
  const [diaSelecionado, setDiaSelecionado] = useState(null)
  const [tipoData, setTipoData] = useState('todas') // 'criacao', 'fechamento', 'todas'

  useEffect(() => {
    loadLembretes()
  }, [])

  // Helper para parsear datas em ambos os formatos
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

  const loadLembretes = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/negocios', {
        params: { status: 'Em andamento' }
      })
      
      const hoje = new Date()
      const negocios = res.data

      console.log('📊 Total de negócios recebidos:', negocios.length)
      console.log('📋 Exemplo de negócio:', negocios[0])
      console.log('📅 Negócios com data_criacao:', negocios.filter(n => n.data_criacao).length)
      console.log('📆 Negócios com data_fechamento:', negocios.filter(n => n.data_fechamento).length)
      console.log('📌 Status únicos:', [...new Set(negocios.map(n => n.status))].join(', '))
      console.log('🎯 Etapas únicas:', [...new Set(negocios.map(n => n.etapa))].join(', '))
      
      // Debug: testar cálculo de dias
      if (negocios[0]?.data_criacao) {
        const dataCriacao = parseData(negocios[0].data_criacao)
        const diffDias = dataCriacao ? Math.floor((hoje - dataCriacao) / (1000 * 60 * 60 * 24)) : null
        console.log('🧪 Teste cálculo dias:', {
          negocio: negocios[0].empresa,
          data_criacao_raw: negocios[0].data_criacao,
          data_objeto: dataCriacao ? dataCriacao.toLocaleDateString('pt-BR') : 'Invalid',
          dias_passados: diffDias,
          status: negocios[0].status,
          etapa: negocios[0].etapa
        })
      }

      // Aguardando Contato - Negócios recentes (0-7 dias) que ainda não fecharam
      const aguardandoContato = negocios.filter(n => {
        if (!n.data_criacao) return false
        // Excluir negócios já fechados
        if (n.status === 'Fechado' || n.status === 'Perdido' || n.status === 'Cancelado') return false
        const dataCriacao = parseData(n.data_criacao)
        if (!dataCriacao) return false
        const diffDias = Math.floor((hoje - dataCriacao) / (1000 * 60 * 60 * 24))
        return diffDias <= 7
      })

      // Proposta Enviada - Negócios em etapa de proposta/negociação há mais de 7 dias
      const propostaEnviada = negocios.filter(n => {
        if (!n.data_criacao || !n.etapa) return false
        // Excluir negócios já fechados
        if (n.status === 'Fechado' || n.status === 'Perdido' || n.status === 'Cancelado') return false
        // Incluir etapas relacionadas a proposta/negociação
        const etapasProposta = ['Proposta enviada', 'Negociação', 'Proposta', 'Em negociação']
        const temProposta = etapasProposta.some(e => n.etapa.toLowerCase().includes(e.toLowerCase()))
        if (!temProposta) return false
        const dataCriacao = parseData(n.data_criacao)
        if (!dataCriacao) return false
        const diffDias = Math.floor((hoje - dataCriacao) / (1000 * 60 * 60 * 24))
        return diffDias > 7
      })

      // Parados - Negócios há mais de 30 dias em qualquer etapa (exceto fechados ou com fechamento próximo)
      const parados = negocios.filter(n => {
        if (!n.data_criacao) return false
        // Excluir negócios já fechados
        if (n.status === 'Fechado' || n.status === 'Perdido' || n.status === 'Cancelado') return false
        // Excluir negócios com fechamento próximo (já aparecem em outra categoria)
        if (n.data_fechamento) {
          const dataFechamento = parseData(n.data_fechamento)
          if (dataFechamento) {
            const diffDiasFechamento = Math.floor((dataFechamento - hoje) / (1000 * 60 * 60 * 24))
            if (diffDiasFechamento >= 0 && diffDiasFechamento <= 15) return false
          }
        }
        const dataCriacao = parseData(n.data_criacao)
        if (!dataCriacao) return false
        const diffDias = Math.floor((hoje - dataCriacao) / (1000 * 60 * 60 * 24))
        return diffDias > 30
      })

      // Reativação - Parados há mais de 60 dias (com ou sem valor alto)
      const reativacao = negocios.filter(n => {
        if (!n.data_criacao) return false
        // Excluir negócios já fechados
        if (n.status === 'Fechado' || n.status === 'Perdido' || n.status === 'Cancelado') return false
        const dataCriacao = parseData(n.data_criacao)
        if (!dataCriacao) return false
        const diffDias = Math.floor((hoje - dataCriacao) / (1000 * 60 * 60 * 24))
        // Priorizar alto valor (>R$50k) OU muito tempo parado (>90 dias)
        if (diffDias > 60) {
          return !n.valor_oferta || n.valor_oferta >= 50000 || diffDias > 90
        }
        return false
      })

      // Sem Fechamento - Apenas negócios ativos sem data de fechamento
      const semFechamento = negocios.filter(n => {
        if (n.data_fechamento) return false
        // Excluir negócios já fechados
        if (n.status === 'Fechado' || n.status === 'Perdido' || n.status === 'Cancelado') return false
        return true
      })

      // Próximo Fechamento - Nos próximos 15 dias
      const proximoFechamento = negocios.filter(n => {
        if (!n.data_fechamento) return false
        const dataFechamento = parseData(n.data_fechamento)
        if (!dataFechamento) return false
        const diffDias = Math.floor((dataFechamento - hoje) / (1000 * 60 * 60 * 24))
        return diffDias >= 0 && diffDias <= 15
      })

      console.log('✅ Filtros aplicados:')
      console.log('  📞 Aguardando Contato:', aguardandoContato.length)
      console.log('  📧 Proposta Enviada:', propostaEnviada.length)
      console.log('  ⚠️ Parados:', parados.length)
      console.log('  🔄 Reativação:', reativacao.length)
      console.log('  📅 Fechamento Próximo:', proximoFechamento.length)
      console.log('  📋 Sem Data:', semFechamento.length)

      setLembretes({
        aguardandoContato,
        propostaEnviada,
        parados,
        reativacao,
        proximoFechamento,
        semFechamento
      })
      
      // Organizar negócios por data para o calendário
      const negociosPorDataMap = {}
      negocios.forEach(negocio => {
        // Data de fechamento
        if (negocio.data_fechamento) {
          const dataObj = parseData(negocio.data_fechamento)
          if (dataObj) {
            const dataFormatada = dataObj.toLocaleDateString('pt-BR').split(' ')[0] // DD/MM/YYYY
            if (!negociosPorDataMap[dataFormatada]) {
              negociosPorDataMap[dataFormatada] = { criacao: [], fechamento: [] }
            }
            negociosPorDataMap[dataFormatada].fechamento.push(negocio)
          }
        }
        // Data de criação
        if (negocio.data_criacao) {
          const dataObj = parseData(negocio.data_criacao)
          if (dataObj) {
            const dataFormatada = dataObj.toLocaleDateString('pt-BR').split(' ')[0] // DD/MM/YYYY
            if (!negociosPorDataMap[dataFormatada]) {
              negociosPorDataMap[dataFormatada] = { criacao: [], fechamento: [] }
            }
            negociosPorDataMap[dataFormatada].criacao.push(negocio)
          }
        }
      })
      setNegociosPorData(negociosPorDataMap)
      
      setLoading(false)
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error)
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const calcularDias = (dataStr) => {
    if (!dataStr) return null
    const data = parseData(dataStr)
    if (!data) return null
    const hoje = new Date()
    return Math.floor((hoje - data) / (1000 * 60 * 60 * 24))
  }

  const filtrarLembretes = (lista) => {
    if (!busca) return lista
    const buscaLower = busca.toLowerCase()
    return lista.filter(n => 
      n.empresa?.toLowerCase().includes(buscaLower) ||
      n.pessoa_contato?.toLowerCase().includes(buscaLower) ||
      n.equipamento?.toLowerCase().includes(buscaLower)
    )
  }

  const exportarFollowUps = () => {
    const dados = {
      'Negócios Parados': lembretes.parados,
      'Fechamento Próximo': lembretes.proximoFechamento,
      'Sem Data de Fechamento': lembretes.semFechamento
    }

    const wb = XLSX.utils.book_new()

    Object.keys(dados).forEach(nomeAba => {
      const dadosExport = dados[nomeAba].map(n => ({
        'Empresa': n.empresa,
        'Contato': n.pessoa_contato || '',
        'Equipamento': n.equipamento || '',
        'Valor Oferta': n.valor_oferta || 0,
        'Status': n.status || '',
        'Etapa': n.etapa || '',
        'Data Criação': n.data_criacao || '',
        'Data Fechamento': n.data_fechamento || '',
        'Dias Parado': calcularDias(n.data_criacao) || '',
        'Observações': n.observacao || ''
      }))

      const ws = XLSX.utils.json_to_sheet(dadosExport)
      XLSX.utils.book_append_sheet(wb, ws, nomeAba)
    })

    const fileName = `Follow_Ups_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  const handleTrocarAba = (abaId) => {
    setAbaAtiva(abaId)
    setPaginaAtual(1)
    setMostrarTodos(false)
  }

  // Funções do calendário
  const getDiasDoMes = () => {
    const ano = mesAtual.getFullYear()
    const mes = mesAtual.getMonth()
    const primeiroDia = new Date(ano, mes, 1)
    const ultimoDia = new Date(ano, mes + 1, 0)
    const diasNoMes = ultimoDia.getDate()
    const diaSemanaInicio = primeiroDia.getDay()
    
    const dias = []
    
    // Dias do mês anterior
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null)
    }
    
    // Dias do mês atual
    for (let dia = 1; dia <= diasNoMes; dia++) {
      dias.push(dia)
    }
    
    return dias
  }

  const mudarMes = (direcao) => {
    const novoMes = new Date(mesAtual)
    novoMes.setMonth(novoMes.getMonth() + direcao)
    setMesAtual(novoMes)
    setDiaSelecionado(null)
  }

  const formatarDataParaChave = (dia) => {
    const d = String(dia).padStart(2, '0')
    const m = String(mesAtual.getMonth() + 1).padStart(2, '0')
    const a = mesAtual.getFullYear()
    return `${d}/${m}/${a}`
  }

  const getNegociosDoDia = (dia) => {
    if (!dia) return { criacao: [], fechamento: [] }
    const chave = formatarDataParaChave(dia)
    const dados = negociosPorData[chave] || { criacao: [], fechamento: [] }
    
    if (tipoData === 'criacao') {
      return { criacao: dados.criacao || [], fechamento: [] }
    } else if (tipoData === 'fechamento') {
      return { criacao: [], fechamento: dados.fechamento || [] }
    }
    return {
      criacao: dados.criacao || [],
      fechamento: dados.fechamento || []
    }
  }

  const mesNome = mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const abas = [
    { id: 'aguardandoContato', nome: 'Aguardando Contato', icon: '📞', count: filtrarLembretes(lembretes.aguardandoContato).length, cor: 'blue' },
    { id: 'propostaEnviada', nome: 'Proposta Enviada', icon: '📧', count: filtrarLembretes(lembretes.propostaEnviada).length, cor: 'yellow' },
    { id: 'parados', nome: 'Parados', icon: '⚠️', count: filtrarLembretes(lembretes.parados).length, cor: 'red' },
    { id: 'reativacao', nome: 'Reativação', icon: '🔄', count: filtrarLembretes(lembretes.reativacao).length, cor: 'purple' },
    { id: 'proximoFechamento', nome: 'Fechamento Próximo', icon: '📅', count: filtrarLembretes(lembretes.proximoFechamento).length, cor: 'green' },
    { id: 'semFechamento', nome: 'Sem Data', icon: '📋', count: filtrarLembretes(lembretes.semFechamento).length, cor: 'gray' }
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-4 py-5 sm:px-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">🔔 Lembretes e Follow-ups</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Negócios que precisam de atenção</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVisualizacao(visualizacao === 'lista' ? 'calendario' : 'lista')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {visualizacao === 'lista' ? '📅 Calendário' : '📋 Lista'}
          </button>
          <button
            onClick={exportarFollowUps}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            📊 Exportar Follow-ups
          </button>
        </div>
      </div>

      <div className="px-4">
        <input
          type="text"
          placeholder="🔍 Buscar empresa, contato ou equipamento..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="px-4">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {abas.map(aba => (
              <button
                key={aba.id}
                onClick={() => handleTrocarAba(aba.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  abaAtiva === aba.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{aba.icon}</span>
                {aba.nome}
                {aba.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    aba.cor === 'red' ? 'bg-red-100 !text-red-900 dark:bg-red-900 dark:!text-red-200' :
                    aba.cor === 'yellow' ? 'bg-yellow-100 !text-yellow-900 dark:bg-yellow-900 dark:!text-yellow-200' :
                    aba.cor === 'blue' ? 'bg-blue-100 !text-blue-900 dark:bg-blue-900 dark:!text-blue-200' :
                    aba.cor === 'green' ? 'bg-green-100 !text-green-900 dark:bg-green-900 dark:!text-green-200' :
                    aba.cor === 'purple' ? 'bg-purple-100 !text-purple-900 dark:bg-purple-900 dark:!text-purple-200' :
                    'bg-gray-100 !text-gray-900 dark:bg-gray-900 dark:!text-gray-200'
                  }`}>
                    {aba.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {visualizacao === 'calendario' ? (
        /* Visualização de Calendário */
        <div className="px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {/* Cabeçalho do Calendário */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => mudarMes(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                ← Anterior
              </button>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                {mesNome}
              </h3>
              <button
                onClick={() => mudarMes(1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                Próximo →
              </button>
            </div>
            
            {/* Filtro de tipo de data */}
            <div className="flex gap-2 mb-6 justify-center">
              <button
                onClick={() => setTipoData('todas')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tipoData === 'todas'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                📅 Todas
              </button>
              <button
                onClick={() => setTipoData('criacao')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tipoData === 'criacao'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                🆕 Data Criação
              </button>
              <button
                onClick={() => setTipoData('fechamento')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tipoData === 'fechamento'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                🎯 Data Fechamento
              </button>
            </div>

            {/* Grade do Calendário */}
            <div className="grid grid-cols-7 gap-2">
              {/* Dias da semana */}
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                <div key={dia} className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2">
                  {dia}
                </div>
              ))}
              
              {/* Dias do mês */}
              {getDiasDoMes().map((dia, index) => {
                const dados = dia ? getNegociosDoDia(dia) : { criacao: [], fechamento: [] }
                const totalCriacao = dados.criacao.length
                const totalFechamento = dados.fechamento.length
                const temNegocios = totalCriacao > 0 || totalFechamento > 0
                const hoje = new Date()
                const ehHoje = dia && 
                  dia === hoje.getDate() && 
                  mesAtual.getMonth() === hoje.getMonth() && 
                  mesAtual.getFullYear() === hoje.getFullYear()
                
                return (
                  <div
                    key={index}
                    onClick={() => dia && setDiaSelecionado(dia)}
                    className={`min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all ${
                      !dia ? 'bg-gray-50 dark:bg-gray-900 cursor-default' :
                      diaSelecionado === dia ? 'bg-blue-100 dark:bg-blue-900 border-blue-500' :
                      ehHoje ? 'bg-yellow-50 dark:bg-yellow-900 border-yellow-500' :
                      temNegocios ? 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700' :
                      'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {dia && (
                      <>
                        <div className={`text-sm font-semibold mb-1 ${
                          ehHoje ? 'text-yellow-700 dark:text-yellow-300' :
                          'text-gray-700 dark:text-gray-300'
                        }`}>
                          {dia}
                        </div>
                        {(tipoData === 'todas' || tipoData === 'criacao') && totalCriacao > 0 && (
                          <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-0.5">
                            🆕 {totalCriacao}
                          </div>
                        )}
                        {(tipoData === 'todas' || tipoData === 'fechamento') && totalFechamento > 0 && (
                          <div className="text-xs text-green-700 dark:text-green-300 font-medium">
                            🎯 {totalFechamento}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Detalhes do dia selecionado */}
            {diaSelecionado && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Negócios em {formatarDataParaChave(diaSelecionado)}
                </h4>
                {(() => {
                  const dados = getNegociosDoDia(diaSelecionado)
                  const totalNegocios = dados.criacao.length + dados.fechamento.length
                  
                  if (totalNegocios === 0) {
                    return <p className="text-gray-500 dark:text-gray-400">Nenhum negócio nesta data.</p>
                  }
                  
                  return (
                    <div className="space-y-4">
                      {dados.criacao.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                            🆕 Criados neste dia ({dados.criacao.length})
                          </h5>
                          <div className="space-y-2">
                            {dados.criacao.map(negocio => (
                              <div key={`c-${negocio.id}`} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <Link 
                                      to={`/negocios/${negocio.id}/editar`}
                                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                    >
                                      {negocio.empresa}
                                    </Link>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {negocio.equipamento}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      negocio.status === 'Em andamento' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {negocio.status}
                                    </span>
                                    {negocio.valor_oferta && (
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                                        {formatCurrency(negocio.valor_oferta)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {dados.fechamento.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                            🎯 Data de Fechamento ({dados.fechamento.length})
                          </h5>
                          <div className="space-y-2">
                            {dados.fechamento.map(negocio => (
                              <div key={`f-${negocio.id}`} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <Link 
                                      to={`/negocios/${negocio.id}/editar`}
                                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                    >
                                      {negocio.empresa}
                                    </Link>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {negocio.equipamento}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      negocio.status === 'Venda Confirmada' ? 'bg-green-100 text-green-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {negocio.status}
                                    </span>
                                    {negocio.valor_oferta && (
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                                        {formatCurrency(negocio.valor_oferta)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Visualização de Lista */
        <>
        <div className="px-4">
        {abaAtiva === 'aguardandoContato' && (
          <LembreteCard
            titulo="Aguardando Contato"
            descricao="Negócios novos que precisam de atenção"
            icon="📞"
            cor="blue"
            negocios={filtrarLembretes(lembretes.aguardandoContato)}
            renderExtra={(n) => (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                📅 Criado há {calcularDias(n.data_criacao)} dias
              </p>
            )}
            formatCurrency={formatCurrency}
            calcularDias={calcularDias}
            paginaAtual={paginaAtual}
            setPaginaAtual={setPaginaAtual}
            itensPorPagina={itensPorPagina}
          />
        )}

        {abaAtiva === 'propostaEnviada' && (
          <LembreteCard
            titulo="Proposta Enviada"
            descricao="Aguardando retorno do cliente"
            icon="📧"
            cor="yellow"
            negocios={filtrarLembretes(lembretes.propostaEnviada)}
            renderExtra={(n) => (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                ⏰ Proposta há {calcularDias(n.data_criacao)} dias
              </p>
            )}
            formatCurrency={formatCurrency}
            calcularDias={calcularDias}
            paginaAtual={paginaAtual}
            setPaginaAtual={setPaginaAtual}
            itensPorPagina={itensPorPagina}
          />
        )}

        {abaAtiva === 'parados' && (
          <LembreteCard
            titulo="Negócios Parados"
            descricao="Mais de 30 dias sem evolução"
            icon="⚠️"
            cor="red"
            negocios={filtrarLembretes(lembretes.parados)}
            renderExtra={(n) => (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                ⏰ Parado há {calcularDias(n.data_criacao)} dias
              </p>
            )}
            formatCurrency={formatCurrency}
            calcularDias={calcularDias}
            paginaAtual={paginaAtual}
            setPaginaAtual={setPaginaAtual}
            itensPorPagina={itensPorPagina}
          />
        )}

        {abaAtiva === 'reativacao' && (
          <LembreteCard
            titulo="Reativação"
            descricao="Negócios de alto valor parados"
            icon="🔄"
            cor="purple"
            negocios={filtrarLembretes(lembretes.reativacao)}
            renderExtra={(n) => (
              <div className="mt-2">
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  ⏰ Parado há {calcularDias(n.data_criacao)} dias
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  💰 Valor: {formatCurrency(n.valor_oferta)}
                </p>
              </div>
            )}
            formatCurrency={formatCurrency}
            calcularDias={calcularDias}
            paginaAtual={paginaAtual}
            setPaginaAtual={setPaginaAtual}
            itensPorPagina={itensPorPagina}
          />
        )}

        {abaAtiva === 'proximoFechamento' && (
          <LembreteCard
            titulo="Fechamento Próximo"
            descricao="Negócios com fechamento nos próximos 15 dias"
            icon="📅"
            cor="green"
            negocios={filtrarLembretes(lembretes.proximoFechamento)}
            renderExtra={(n) => (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                📆 Previsão: {n.data_fechamento}
              </p>
            )}
            formatCurrency={formatCurrency}
            calcularDias={calcularDias}
            paginaAtual={paginaAtual}
            setPaginaAtual={setPaginaAtual}
            itensPorPagina={itensPorPagina}
          />
        )}

        {abaAtiva === 'semFechamento' && (
          <LembreteCard
            titulo="Sem Data de Fechamento"
            descricao="Negócios sem previsão de fechamento"
            icon="📋"
            cor="gray"
            negocios={filtrarLembretes(lembretes.semFechamento)}
            renderExtra={(n) => (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Etapa: {n.etapa || 'Sem etapa'}
              </p>
            )}
            formatCurrency={formatCurrency}
            calcularDias={calcularDias}
            paginaAtual={paginaAtual}
            setPaginaAtual={setPaginaAtual}
            itensPorPagina={itensPorPagina}
          />
        )}
        </div>
        </>
      )}
    </div>
  )
}

function LembreteCard({ titulo, descricao, icon, cor, negocios, renderExtra, formatCurrency, calcularDias, paginaAtual, setPaginaAtual, itensPorPagina }) {
  const [expandidos, setExpandidos] = useState([])

  const toggleExpandir = (id) => {
    setExpandidos(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }
  const corClasses = {
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-900 dark:text-red-100',
      desc: 'text-red-700 dark:text-red-300',
      cardBorder: 'border-red-200 dark:border-red-700'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-900 dark:text-yellow-100',
      desc: 'text-yellow-700 dark:text-yellow-300',
      cardBorder: 'border-yellow-200 dark:border-yellow-700'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100',
      desc: 'text-blue-700 dark:text-blue-300',
      cardBorder: 'border-blue-200 dark:border-blue-700'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-900 dark:text-green-100',
      desc: 'text-green-700 dark:text-green-300',
      cardBorder: 'border-green-200 dark:border-green-700'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-900 dark:text-purple-100',
      desc: 'text-purple-700 dark:text-purple-300',
      cardBorder: 'border-purple-200 dark:border-purple-700'
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-800',
      text: 'text-gray-900 dark:text-gray-100',
      desc: 'text-gray-700 dark:text-gray-300',
      cardBorder: 'border-gray-200 dark:border-gray-700'
    }
  }

  const cores = corClasses[cor]

  // Paginação
  const totalPaginas = Math.ceil(negocios.length / itensPorPagina)
  const indiceInicio = (paginaAtual - 1) * itensPorPagina
  const indiceFim = indiceInicio + itensPorPagina
  const negociosPaginados = negocios.slice(indiceInicio, indiceFim)

  // Calcular valor total
  const valorTotal = negocios.reduce((sum, n) => sum + (n.valor_oferta || 0), 0)

  return (
    <div className={`${cores.bg} border-2 ${cores.border} rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-3xl mr-3">{icon}</span>
          <div>
            <h3 className={`text-xl font-bold ${cores.text}`}>
              {titulo} ({negocios.length})
            </h3>
            <p className={`text-sm ${cores.desc}`}>{descricao}</p>
          </div>
        </div>
        <div className={`text-right ${cores.text}`}>
          <p className="text-sm font-medium">Valor Total</p>
          <p className="text-lg font-bold">{formatCurrency(valorTotal)}</p>
        </div>
      </div>

      {negocios.length === 0 ? (
        <p className={cores.desc}>Nenhum item nesta categoria! 👍</p>
      ) : (
        <>
          <div className="space-y-2">
            {negociosPaginados.map(n => {
              const isExpandido = expandidos.includes(n.id)
              
              return (
                <div 
                  key={n.id} 
                  className={`bg-white dark:bg-gray-800 rounded-lg border ${cores.cardBorder} transition-all ${
                    isExpandido ? 'p-4' : 'p-3 hover:shadow-md cursor-pointer'
                  }`}
                  onClick={() => !isExpandido && toggleExpandir(n.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start gap-2">
                        <Link 
                          to={`/negocios/${n.id}/editar`}
                          className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {n.empresa}
                        </Link>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          {formatCurrency(n.valor_oferta)}
                        </span>
                      </div>
                      
                      {!isExpandido ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {n.equipamento || 'Sem equipamento'} • Clique para ver detalhes
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2 text-sm">
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Contato:</span> {n.pessoa_contato || '-'}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Equipamento:</span> {n.equipamento || '-'}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Origem:</span> {n.origem || '-'}
                          </p>
                          {n.observacao && (
                            <p className="text-gray-600 dark:text-gray-400 text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded">
                              <span className="font-medium">Obs:</span> {n.observacao}
                            </p>
                          )}
                          {renderExtra && renderExtra(n)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isExpandido && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpandir(n.id)
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          ✕
                        </button>
                      )}
                      <Link 
                        to={`/negocios/${n.id}/editar`}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Editar →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
              <div>
                <p className={`text-sm ${cores.desc}`}>
                  Mostrando {indiceInicio + 1} a {Math.min(indiceFim, negocios.length)} de {negocios.length}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  ← Anterior
                </button>
                <span className={`px-3 py-1 ${cores.text} font-medium`}>
                  {paginaAtual} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Lembretes
