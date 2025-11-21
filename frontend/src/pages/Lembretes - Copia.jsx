import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import * as XLSX from 'xlsx'

function Lembretes() {
  const [lembretes, setLembretes] = useState({
    parados: [],
    semFechamento: [],
    proximoFechamento: []
  })
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('parados')
  const [busca, setBusca] = useState('')
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina] = useState(20)

  useEffect(() => {
    loadLembretes()
  }, [])

  const loadLembretes = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/negocios', {
        params: { status: 'Em andamento' }
      })
      
      const hoje = new Date()
      const negocios = res.data

      const parados = negocios.filter(n => {
        if (!n.data_criacao) return false
        const [dia, mes, ano] = n.data_criacao.split('/')
        const dataCriacao = new Date(ano, mes - 1, dia)
        const diffDias = Math.floor((hoje - dataCriacao) / (1000 * 60 * 60 * 24))
        return diffDias > 30 && n.etapa === 'Contato inicial'
      })

      const semFechamento = negocios.filter(n => !n.data_fechamento)

      const proximoFechamento = negocios.filter(n => {
        if (!n.data_fechamento) return false
        const [dia, mes, ano] = n.data_fechamento.split('/')
        const dataFechamento = new Date(ano, mes - 1, dia)
        const diffDias = Math.floor((dataFechamento - hoje) / (1000 * 60 * 60 * 24))
        return diffDias >= 0 && diffDias <= 15
      })

      setLembretes({
        parados,
        semFechamento,
        proximoFechamento
      })
      
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
    const [dia, mes, ano] = dataStr.split('/')
    const data = new Date(ano, mes - 1, dia)
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

  const abas = [
    { id: 'parados', nome: 'Parados', icon: '⚠️', count: filtrarLembretes(lembretes.parados).length, cor: 'red' },
    { id: 'proximoFechamento', nome: 'Fechamento Próximo', icon: '📅', count: filtrarLembretes(lembretes.proximoFechamento).length, cor: 'yellow' },
    { id: 'semFechamento', nome: 'Sem Data', icon: '📝', count: filtrarLembretes(lembretes.semFechamento).length, cor: 'blue' }
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
        <button
          onClick={exportarFollowUps}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          📊 Exportar Follow-ups
        </button>
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
                    'bg-blue-100 !text-blue-900 dark:bg-blue-900 dark:!text-blue-200'
                  }`}>
                    {aba.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="px-4">
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

        {abaAtiva === 'proximoFechamento' && (
          <LembreteCard
            titulo="Fechamento Próximo"
            descricao="Previsão de fechamento nos próximos 15 dias"
            icon="📅"
            cor="yellow"
            negocios={filtrarLembretes(lembretes.proximoFechamento)}
            renderExtra={(n) => (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
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
            descricao="Defina uma previsão de fechamento"
            icon="📝"
            cor="blue"
            negocios={filtrarLembretes(lembretes.semFechamento)}
            renderExtra={(n) => (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
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
