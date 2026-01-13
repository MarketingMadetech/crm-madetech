import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import * as XLSX from 'xlsx'

function Relatorios() {
  const [negocios, setNegocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    status: '',
    etapa: '',
    origem: ''
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const res = await axios.get('/api/negocios')
      setNegocios(res.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Dados filtrados
  const negociosFiltrados = negocios.filter(n => {
    if (filtros.status && n.status !== filtros.status) return false
    if (filtros.etapa && n.etapa !== filtros.etapa) return false
    if (filtros.origem && n.origem !== filtros.origem) return false
    // TODO: filtrar por data
    return true
  })

  // Análise por etapa
  const dadosPorEtapa = Object.entries(
    negociosFiltrados.reduce((acc, n) => {
      const etapa = n.etapa || 'Sem etapa'
      acc[etapa] = (acc[etapa] || 0) + 1
      return acc
    }, {})
  ).map(([etapa, count]) => ({ etapa, quantidade: count }))

  // Análise por origem
  const dadosPorOrigem = Object.entries(
    negociosFiltrados.reduce((acc, n) => {
      const origem = n.origem || 'Sem origem'
      acc[origem] = (acc[origem] || 0) + 1
      return acc
    }, {})
  ).map(([origem, count]) => ({ origem, quantidade: count }))

  // Análise por status
  const dadosPorStatus = Object.entries(
    negociosFiltrados.reduce((acc, n) => {
      const status = n.status || 'Sem status'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
  ).map(([status, count]) => ({ status, quantidade: count }))

  // Valor total por etapa
  const valorPorEtapa = Object.entries(
    negociosFiltrados.reduce((acc, n) => {
      const etapa = n.etapa || 'Sem etapa'
      acc[etapa] = (acc[etapa] || 0) + (n.valor_oferta || 0)
      return acc
    }, {})
  ).map(([etapa, valor]) => ({ etapa, valor }))

  // Taxa de conversão
  const totalNegocios = negociosFiltrados.length
  const negociosFechados = negociosFiltrados.filter(n => n.status === 'VENDA CONFIRMADA').length
  const negociosPerdidos = negociosFiltrados.filter(n => n.status === 'PERDIDO').length
  const taxaConversao = totalNegocios > 0 ? ((negociosFechados / totalNegocios) * 100).toFixed(1) : 0

  // Valor total
  const valorTotal = negociosFiltrados.reduce((sum, n) => sum + (n.valor_oferta || 0), 0)
  const valorFechado = negociosFiltrados
    .filter(n => n.status === 'VENDA CONFIRMADA')
    .reduce((sum, n) => sum + (n.valor_oferta || 0), 0)

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

  const exportarRelatorio = () => {
    const dados = negociosFiltrados.map(n => ({
      'Empresa': n.empresa,
      'Contato': n.pessoa_contato || '',
      'Telefone': n.telefone || '',
      'Email': n.email || '',
      'Equipamento': n.equipamento || '',
      'Valor': n.valor_oferta || 0,
      'Status': n.status || '',
      'Etapa': n.etapa || '',
      'Origem': n.origem || '',
      'Data Criação': n.data_criacao || '',
      'Data Fechamento': n.data_fechamento || ''
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(dados)
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório')

    const fileName = `Relatorio_CRM_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-400">Carregando relatórios...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📊 Relatórios e Análises</h1>
        <button
          onClick={exportarRelatorio}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          📥 Exportar Excel
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500">
          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total de Negócios</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalNegocios}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-l-4 border-green-500">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">Taxa de Conversão</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{taxaConversao}%</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border-l-4 border-purple-500">
          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Valor Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(valorTotal)}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Valor Fechado</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(valorFechado)}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Negócios por Etapa */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Negócios por Etapa do Funil</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dadosPorEtapa} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="etapa" 
                angle={-45} 
                textAnchor="end" 
                height={120}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#3b82f6">
                {dadosPorEtapa.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Linha com 2 gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Negócios por Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribuição por Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPorStatus}
                  dataKey="quantidade"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, quantidade }) => `${status}: ${quantidade}`}
                  labelLine={{ stroke: '#888', strokeWidth: 1 }}
                >
                  {dadosPorStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Legenda customizada */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {dadosPorStatus.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: cores[index % cores.length] }}
                  />
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {item.status} ({item.quantidade})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Negócios por Origem */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Origem dos Negócios</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPorOrigem}
                  dataKey="quantidade"
                  nameKey="origem"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ origem, quantidade }) => `${quantidade}`}
                >
                  {dadosPorOrigem.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Legenda customizada */}
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm max-h-32 overflow-y-auto">
              {dadosPorOrigem.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: cores[index % cores.length] }}
                  />
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {item.origem} ({item.quantidade})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Valor por Etapa */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Valor Total por Etapa</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={valorPorEtapa} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="etapa" 
                angle={-45} 
                textAnchor="end" 
                height={120}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="valor" fill="#10b981">
                {valorPorEtapa.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={cores[index % cores.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de Top Negócios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🏆 Top 10 Maiores Negócios</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Etapa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {negociosFiltrados
                .sort((a, b) => (b.valor_oferta || 0) - (a.valor_oferta || 0))
                .slice(0, 10)
                .map((negocio) => (
                  <tr key={negocio.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{negocio.empresa}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(negocio.valor_oferta)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{negocio.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{negocio.etapa}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Relatorios
