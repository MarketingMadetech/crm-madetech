import React, { useState, useEffect, useCallback } from 'react'
import api from '../utils/api';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import cacheService from '../utils/cacheService'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#a4de6c', '#d0ed57', '#83a6ed']

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [pipeline, setPipeline] = useState([])
  const [topNegocios, setTopNegocios] = useState([])
  const [tendenciaEtapas, setTendenciaEtapas] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [periodo, setPeriodo] = useState('todos')

  useEffect(() => {
    loadData(true) // Força refresh ao mudar período
  }, [periodo])

  useEffect(() => {
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(() => {
      loadData(true)
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      console.log('🔄 Carregando dados do dashboard - Período:', periodo, 'ForceRefresh:', forceRefresh)
      const isRefreshing = forceRefresh || lastUpdated !== null
      setRefreshing(isRefreshing)
      if (!isRefreshing) setLoading(true)
      
      // Chave de cache baseada no período
      const cacheKey = `dashboard:${periodo}`
      
      // TEMPORÁRIO: Sempre buscar dados frescos (ignorar cache)
      // Tenta usar cache se não forçar refresh
      // if (!forceRefresh && cacheService.has(cacheKey)) {
      //   const cached = cacheService.get(cacheKey)
      //   setStats(cached.stats)
      //   setPipeline(cached.pipeline)
      //   setTopNegocios(cached.topNegocios || [])
      //   setTendenciaEtapas(cached.tendencia || [])
      //   setLoading(false)
      //   setRefreshing(false)
      //   return
      // }
      
      const params = { periodo }
      console.log('📡 Fazendo requisições com params:', params)
      
      // Buscar dados com tratamento individual de erros
      const statsRes = await api.get('/dashboard/stats', { params }).catch(err => {
        console.error('Erro ao buscar stats:', err)
        return { data: null }
      })
      
      const pipelineRes = await api.get('/dashboard/pipeline', { params }).catch(err => {
        console.error('Erro ao buscar pipeline:', err)
        return { data: [] }
      })
      
      const negociosRes = await api.get('/negocios').catch(err => {
        console.error('Erro ao buscar negócios:', err)
        return { data: [] }
      })
      
      const tendenciaRes = await api.get('/dashboard/tendencia', { params }).catch(err => {
        console.error('Erro ao buscar tendência:', err)
        return { data: [] }
      })
      
      // Processar top 10 negócios por valor
      const negociosOrdenados = (negociosRes.data || [])
        .filter(n => n.valor_oferta > 0)
        .sort((a, b) => (b.valor_oferta || 0) - (a.valor_oferta || 0))
        .slice(0, 10)
      
      // Armazena no cache (10 minutos)
      const data = { 
        stats: statsRes.data, 
        pipeline: pipelineRes.data,
        topNegocios: negociosOrdenados,
        tendencia: tendenciaRes.data
      }
      cacheService.set(cacheKey, data, 10 * 60 * 1000)
      
      setStats(statsRes.data)
      setPipeline(pipelineRes.data)
      setTopNegocios(negociosOrdenados)
      setTendenciaEtapas(tendenciaRes.data)
      setLastUpdated(new Date())
      setLoading(false)
      setRefreshing(false)
      
      console.log('✅ Dados carregados:', {
        total: statsRes.data?.total,
        vendas: statsRes.data?.negoccios_fechados,
        periodo: periodo
      })
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
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

  const formatarData = (dataStr) => {
    if (!dataStr) return 'N/A'
    try {
      let data
      if (dataStr.includes('-')) {
        data = new Date(dataStr.split(' ')[0])
      } else if (dataStr.includes('/')) {
        const [dia, mes, ano] = dataStr.split('/')
        data = new Date(ano, mes - 1, dia)
      } else {
        return 'N/A'
      }
      return data.toLocaleDateString('pt-BR')
    } catch {
      return 'N/A'
    }
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
            <option value="todos">Todos os negócios</option>
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
                    {stats?.negoccios_fechados || 0}
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
        {/* Distribuição por Status */}
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
                outerRadius={80}
                label={({ status, count, percent }) => `${count} (${(percent * 100).toFixed(0)}%)`}
              >
                {stats?.por_status?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          {/* Custom Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {stats?.por_status?.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por Origem */}
        <div className="bg-white dark:bg-gray-800 p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top 10 Origens</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(stats?.por_origem || []).slice(0, 10)} margin={{ bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="origem" angle={-45} textAnchor="end" height={100} interval={0} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count">
                {(stats?.por_origem || []).slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Custom Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {(stats?.por_origem || []).slice(0, 10).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate" title={item.origem}>
                  {item.origem} ({item.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tendência de Criação de Negócios */}
      {tendenciaEtapas && tendenciaEtapas.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tendência de Criação de Negócios (últimos 30 dias)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tendenciaEtapas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="quantidade" stroke="#3B82F6" strokeWidth={2} name="Negócios Criados" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top 10 Maiores Negócios */}
      {topNegocios && topNegocios.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">🏆 Top 10 Maiores Negócios</h3>
            <Link to="/negocios" className="text-sm text-blue-600 hover:text-blue-700">Ver todos →</Link>
          </div>
          <div className="px-6 py-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Equipamento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Etapa</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fechamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {topNegocios.map((negocio, index) => (
                    <tr key={negocio.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm">
                        <Link to={`/negocios/${negocio.id}/editar`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {negocio.empresa || 'Sem nome'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                        {negocio.equipamento || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">
                        {formatCurrency(negocio.valor_oferta)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          negocio.status === 'VENDA CONFIRMADA' ? 'bg-green-100 text-green-800' :
                          negocio.status === 'Em andamento' ? 'bg-blue-100 text-blue-800' :
                          negocio.status === 'Perdido' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {negocio.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {negocio.etapa || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {formatarData(negocio.data_fechamento)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline de Vendas por Etapa */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pipeline de Vendas por Etapa</h3>
        </div>
        <div className="px-6 py-4">
          {/* Gráfico de Barras */}
          <div className="mb-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={pipeline} margin={{ bottom: 100, left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="etapa" angle={-45} textAnchor="end" height={120} interval={0} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'valor_total' || name === 'valor_medio') {
                      return formatCurrency(value)
                    }
                    return value
                  }}
                />
                <Legend />
                <Bar dataKey="quantidade" fill="#3B82F6" name="Quantidade" />
                <Bar dataKey="valor_total" fill="#10B981" name="Valor Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela Detalhada */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Etapa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantidade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Médio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">% do Total</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pipeline.map((item, index) => {
                  const totalGeral = pipeline.reduce((sum, p) => sum + (p.valor_total || 0), 0)
                  const percentual = totalGeral > 0 ? ((item.valor_total / totalGeral) * 100).toFixed(1) : 0
                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.etapa || 'Sem etapa'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.quantidade}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.valor_total)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.valor_medio)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentual}%` }}></div>
                          </div>
                          <span>{percentual}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
