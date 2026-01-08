import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'

function NegocioForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    empresa: '',
    pessoa_contato: '',
    telefone: '',
    email: '',
    equipamento: '',
    tipo_maquina: '',
    tipo_negociacao: '',
    valor_produto: '',
    valor_oferta: '',
    valor_fabrica: '',
    valor_brasil: '',
    data_criacao: '',
    data_fechamento: '',
    etapa: '',
    status: '',
    origem: '',
    observacao: '',
    ocorrencias: ''
  })

  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  
  // Estado para nova ocorrência
  const [novaOcorrencia, setNovaOcorrencia] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: ''
  })

  useEffect(() => {
    if (isEditing) {
      loadNegocio()
    }
  }, [id])

  const loadNegocio = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get(`/api/negocios/${id}`)
      setFormData(res.data)
    } catch (error) {
      console.error('Erro ao carregar negócio:', error)
      setError('Erro ao carregar negócio. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const adicionarOcorrencia = () => {
    if (!novaOcorrencia.descricao.trim()) {
      alert('Por favor, descreva a ocorrência')
      return
    }
    
    const dataFormatada = new Date(novaOcorrencia.data).toLocaleDateString('pt-BR')
    const textoOcorrencia = `[${dataFormatada}] ${novaOcorrencia.descricao}`
    
    setFormData(prev => ({
      ...prev,
      ocorrencias: prev.ocorrencias ? `${prev.ocorrencias}\n${textoOcorrencia}` : textoOcorrencia
    }))
    
    // Limpar campos da ocorrência
    setNovaOcorrencia({
      data: new Date().toISOString().split('T')[0],
      descricao: ''
    })
  }

  const removerOcorrencia = (index) => {
    const ocorrencias = formData.ocorrencias.split('\n').filter(o => o.trim())
    ocorrencias.splice(index, 1)
    setFormData(prev => ({
      ...prev,
      ocorrencias: ocorrencias.join('\n')
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    
    try {
      if (isEditing) {
        await axios.put(`/api/negocios/${id}`, formData)
      } else {
        await axios.post('/api/negocios', formData)
      }
      navigate('/negocios')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setError('Erro ao salvar negócio. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Negócio' : 'Novo Negócio'}
        </h2>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin text-3xl mb-2">⏳</div>
            <p className="text-gray-600">Carregando negócio...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
          ⚠️ {error}
        </div>
      )}

      {!loading && (
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
            <input
              type="text"
              name="empresa"
              value={formData.empresa}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pessoa de Contato</label>
            <input
              type="text"
              name="pessoa_contato"
              value={formData.pessoa_contato}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contato@empresa.com.br"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento</label>
            <input
              type="text"
              name="equipamento"
              value={formData.equipamento}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo da Máquina</label>
            <select
              name="tipo_maquina"
              value={formData.tipo_maquina}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              <option value="Nova">Nova</option>
              <option value="Semi Nova">Semi Nova</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Negociação</label>
            <select
              name="tipo_negociacao"
              value={formData.tipo_negociacao}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              <option value="Nacionalizada">Nacionalizada</option>
              <option value="Importação Direta">Importação Direta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Produto</label>
            <input
              type="number"
              step="0.01"
              name="valor_produto"
              value={formData.valor_produto}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Oferta</label>
            <input
              type="number"
              step="0.01"
              name="valor_oferta"
              value={formData.valor_oferta}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Fábrica</label>
            <input
              type="number"
              step="0.01"
              name="valor_fabrica"
              value={formData.valor_fabrica}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Brasil</label>
            <input
              type="number"
              step="0.01"
              name="valor_brasil"
              value={formData.valor_brasil}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
            <input
              type="text"
              name="data_criacao"
              value={formData.data_criacao}
              onChange={handleChange}
              placeholder="DD/MM/YYYY"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fechamento Esperada</label>
            <input
              type="text"
              name="data_fechamento"
              value={formData.data_fechamento}
              onChange={handleChange}
              placeholder="DD/MM/YYYY"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
            <input
              type="text"
              name="etapa"
              value={formData.etapa}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Contato inicial">Contato inicial</option>
              <option value="Proposta enviada">Proposta enviada</option>
              <option value="VENDA CONFIRMADA">VENDA CONFIRMADA</option>
              <option value="PERDIDO">PERDIDO</option>
              <option value="SUSPENSO">SUSPENSO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origem da Negociação</label>
            <input
              type="text"
              name="origem"
              value={formData.origem}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Sistema de Ocorrências */}
        {isEditing && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📋 Nova Ocorrência</h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                  <input
                    type="date"
                    value={novaOcorrencia.data}
                    onChange={(e) => setNovaOcorrencia(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição *</label>
                  <input
                    type="text"
                    placeholder="Ex: Cliente solicitou desconto adicional"
                    value={novaOcorrencia.descricao}
                    onChange={(e) => setNovaOcorrencia(prev => ({ ...prev, descricao: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        adicionarOcorrencia()
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={adicionarOcorrencia}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                ➕ Adicionar Ocorrência
              </button>
            </div>
          </div>
        )}

        {/* Campo de Ocorrências */}
        {isEditing && formData.ocorrencias && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📝 Histórico de Ocorrências
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-2 bg-gray-50 dark:bg-gray-700/50">
              {formData.ocorrencias.split('\n').filter(o => o.trim()).map((ocorrencia, index) => {
                const match = ocorrencia.match(/\[(\d{2}\/\d{2}\/\d{4})\]\s*(.+)/);
                if (match) {
                  const [, data, descricao] = match;
                  return (
                    <div key={index} className="flex gap-3 items-start bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-3 group hover:border-red-300 dark:hover:border-red-700 transition-colors">
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap pt-0.5">{data}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{descricao}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Deseja realmente remover esta ocorrência?')) {
                            removerOcorrencia(index)
                          }
                        }}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remover ocorrência"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                }
                return (
                  <div key={index} className="flex gap-3 items-start bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-3 group">
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{ocorrencia}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Deseja realmente remover esta ocorrência?')) {
                          removerOcorrencia(index)
                        }
                      }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover ocorrência"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              💡 Passe o mouse sobre uma ocorrência para ver o botão de remover
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Observações Gerais
          </label>
          <textarea
            name="observacao"
            value={formData.observacao}
            onChange={handleChange}
            rows="4"
            placeholder="Observações gerais sobre o negócio..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/negocios')}
            disabled={submitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="inline-block animate-spin">⏳</span>
                Salvando...
              </>
            ) : (
              isEditing ? 'Atualizar' : 'Criar'
            )}
          </button>
        </div>
      </form>
      )}
    </div>
  )
}

export default NegocioForm
