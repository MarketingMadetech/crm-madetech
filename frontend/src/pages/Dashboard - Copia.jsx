import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts'
import cacheService from '../utils/cacheService'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [pipeline, setPipeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [periodo, setPeriodo] = useState('30d')

  useEffect(() => {
    loadData()
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(() => {
      loadData(true)
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [periodo])

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      const isRefreshing = forceRefresh || lastUpdated !== null
      setRefreshing(isRefreshing)
      if (!isRefreshing) setLoading(true)
      
      // Chave de cache baseada no período
      const cacheKey = `dashboard:${periodo}`
      
      // Tenta usar cache se não forçar refresh
      if (!forceRefresh && cacheService.has(cacheKey)) {
        const cached = cacheService.get(cacheKey)
        setStats(cached.stats)
        setPipeline(cached.pipeline)
        setLoading(false)
        setRefreshing(false)
        return
      }
      
      const params = { periodo }
      const [statsRes, pipelineRes] = await Promise.all([
        axios.get('/api/dashboard/stats', { params }),
        axios.get('/api/dashboard/pipeline', { params })
      ])
      
      // Armazena no cache (10 minutos)
      const data = { stats: statsRes.data, pipeline: pipelineRes.data }
      cacheService.set(cacheKey, data, 10 * 60 * 1000)
      
      setStats(statsRes.data)
      setPipeline(pipelineRes.data)
      setLastUpdated(new Date())
      setLoading(false)
      setRefreshing(false)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setLoading(false)
      setRefreshing(false)
    }
  }, [periodo])

  // Calcular minutos desde última atualização
  const getMinutosAtras = () => {
    if (!lastUpdated) return null
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 60000)
    if (diff === 0) return 'agora'
    if (diff === 1) return '1 min'
    return `${diff} min`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    )
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  return (
    <div className="space-y-6">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <div className="flex gap-3 items-center">
          {/* Seletor de Período */}
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="anual">Este ano</option>
          </select>
          
          {/* Botão Atualizar */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Atualizar dados"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                Atualizando...
              </>
            ) : (
              <>🔄 Atualizar</>
            )}
          </button>
        </div>
      </div>

      {/* Timestamp de última atualização */}
      {lastUpdated && (
        <div className="px-4 text-xs text-gray-500 dark:text-gray-400">
          Atualizado há {getMinutosAtras()} • Auto-refresh a cada 5 min
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total de Negócios */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Total de Negócios</h3>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-4xl">📈</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Total de Negócios</dt>
                    <dd className="text-3xl font-semibold text-gray-900 dark:text-white">{stats?.total || 0}</dd>
                  </dl>
                </div>
              </div>
              {stats?.trend_total !== undefined && stats?.trend_total !== 0 && (
                <div className={`px-2 py-1 rounded text-sm font-medium ${stats.trend_total >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {stats.trend_total >= 0 ? '↑' : '↓'} {Math.abs(stats.trend_total)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Valor Total em Ofertas */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Valor Total em Ofertas</h3>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-4xl">💰</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Valor Total em Ofertas</dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(stats?.valor_total_ofertas)}</dd>
                  </dl>
                </div>
              </div>
              {stats?.trend_valor !== undefined && stats?.trend_valor !== 0 && (
                <div className={`px-2 py-1 rounded text-sm font-medium ${stats.trend_valor >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {stats.trend_valor >= 0 ? '↑' : '↓'} {Math.abs(stats.trend_valor)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Em Andamento */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Em Andamento</h3>
          </div>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-4xl">✅</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Em Andamento</dt>
                  <dd className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {stats?.por_status?.find(s => s.status === 'Em andamento')?.count || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Vendas Confirmadas */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Vendas Confirmadas</h3>
          </div>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-4xl">🎯</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Vendas Confirmadas</dt>
                  <dd className="text-3xl font-semibold text-green-600">
                    {stats?.por_status?.find(s => s.status === 'VENDA CONFIRMADA')?.count || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Negócios em Risco */}
        <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-3xl">⚠️</span>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">Negócios em Risco</h3>
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                {stats?.negocios_em_risco?.count || 0} negócio(s) parado(s) há mais de 30 dias
              </p>
              {stats?.negocios_em_risco?.count > 0 && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  Valor em risco: <span className="font-bold">{formatCurrency(stats.negocios_em_risco.valor_total)}</span>
                </p>
              )}
              <a href="/negocios?filtro=risco" className="mt-3 inline-block text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800">
                Ver detalhes →
              </a>
            </div>
          </div>
        </div>

        {/* Oportunidades */}
        <div className="bg-amber-50 dark:bg-amber-900 border-l-4 border-amber-500 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-3xl">🎯</span>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-amber-800 dark:text-amber-200">Oportunidades</h3>
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                {stats?.oportunidades?.count || 0} proposta(s) aguardando resposta
              </p>
              {stats?.oportunidades?.count > 0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Valor em pauta: <span className="font-bold">{formatCurrency(stats.oportunidades.valor_total)}</span>
                </p>
              )}
              <a href="/funil" className="mt-3 inline-block text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-800">
                Ver funil →
              </a>
            </div>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-3xl">📊</span>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200">Taxa de Conversão</h3>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                {stats?.taxa_conversao || 0}% dos negócios foram fechados
              </p>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                <span className="font-bold">{stats?.negoccios_fechados || 0}</span> de {stats?.total || 0} negócios
              </p>
              <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(stats?.taxa_conversao || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats?.por_status || []}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ status, count }) => `${status}: ${count}`}
              >
                {stats?.por_status?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top 10 Origens</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.por_origem || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="origem" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pipeline de Vendas</h3>
        </div>
        <div className="px-6 py-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Etapa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantidade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Médio</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                {pipeline.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.etapa || 'Sem etapa'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.quantidade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.valor_total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.valor_medio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
