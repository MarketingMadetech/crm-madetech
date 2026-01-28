import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { formatarDataBrasileira, converterParaISO, autoFormatarData, autoFormatarTelefone } from '../utils/dateUtils'
import EQUIPAMENTOS from '../config/equipamentos'
import RetornosAgendados from '../components/RetornosAgendados'

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
    valor_produto_moeda: 'BRL',
    valor_fabrica_moeda: 'BRL',
    valor_brasil_moeda: 'BRL',
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
  const [origensDisponiveis, setOrigensDisponiveis] = useState([])
  
  // Estado para nova ocorrência
  const [novaOcorrencia, setNovaOcorrencia] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: ''
  })

  useEffect(() => {
    loadOrigens()
    if (isEditing) {
      loadNegocio()
    }
  }, [id])

  // Preposições que devem ficar em minúsculo
  const preposicoes = ['a', 'à', 'ao', 'aos', 'as', 'com', 'contra', 'da', 'das', 'de', 'do', 'dos', 'em', 'e', 'na', 'nas', 'no', 'nos', 'o', 'os', 'para', 'pelo', 'pela', 'pelos', 'pelas', 'por', 'um', 'uma', 'uns', 'umas']

  // Função para converter para Title Case respeitando preposições
  const toTitleCase = (str) => {
    if (!str) return ''
    const palavras = str.trim().split(/\s+/)
    return palavras.map((palavra, index) => {
      const palavraLower = palavra.toLowerCase()
      // Primeira palavra sempre com maiúscula
      if (index === 0) {
        return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()
      }
      // Preposições ficam em minúsculo
      if (preposicoes.includes(palavraLower)) {
        return palavraLower
      }
      // Resto em Title Case
      return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()
    }).join(' ')
  }

  const loadOrigens = async () => {
    try {
      const res = await axios.get('/api/filtros')
      const origensRaw = res.data.origens || []
      
      // NÃO normalizar - manter TODOS os dados do banco como estão
      // (O dropdown mostra as opções existentes, o input permite criar novas)
      const origensUnicas = (origensRaw || []).sort((a, b) => 
        a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
      )
      
      setOrigensDisponiveis(origensUnicas)
    } catch (error) {
      console.error('Erro ao carregar origens:', error)
    }
  }

  const loadNegocio = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get(`/api/negocios/${id}`)
      
      // Converter datas ISO do banco para formato brasileiro para exibição
      const dadosFormatados = {
        ...res.data,
        data_criacao: formatarDataBrasileira(res.data.data_criacao),
        data_fechamento: formatarDataBrasileira(res.data.data_fechamento)
      }
      
      setFormData(dadosFormatados)
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

  // Função para formatar valor em R$
  const formatarReal = (valor) => {
    if (!valor) return ''
    const numero = valor.toString().replace(/\D/g, '')
    const valorFormatado = (Number(numero) / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return valorFormatado
  }

  // Função para converter valor formatado em número
  const converterParaNumero = (valorFormatado) => {
    if (!valorFormatado) return ''
    return valorFormatado.replace(/\./g, '').replace(',', '.')
  }

  // Handler específico para campos de valor
  const handleValorChange = (e) => {
    const { name, value } = e.target
    const apenasNumeros = value.replace(/\D/g, '')
    const valorEmReais = (Number(apenasNumeros) / 100).toFixed(2)
    setFormData(prev => ({ ...prev, [name]: valorEmReais }))
  }

  // Função para exibir valor formatado no input
  const exibirValorFormatado = (valor) => {
    if (!valor || valor === '0' || valor === '0.00') return ''
    return Number(valor).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Função para obter símbolo da moeda
  const getSimboloMoeda = (moeda) => {
    const simbolos = {
      'BRL': 'R$',
      'USD': '$',
      'EUR': '€'
    }
    return simbolos[moeda] || 'R$'
  }

  const adicionarOcorrencia = () => {
    if (!novaOcorrencia.descricao.trim()) {
      alert('Por favor, descreva a ocorrência')
      return
    }
    
    // Evita bug de timezone: passa a data como "YYYY-MM-DD" e formata corretamente
    const [ano, mes, dia] = novaOcorrencia.data.split('-')
    const dataFormatada = `${dia}/${mes}/${ano}`
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
    
    console.log('📝 [FRONTEND] Iniciando submit do formulário');
    console.log('📝 [FRONTEND] Modo:', isEditing ? 'EDIÇÃO' : 'CRIAÇÃO');
    console.log('📝 [FRONTEND] Dados do formulário:', formData);
    
    try {
      // Converter datas brasileiras para formato ISO antes de enviar
      const dadosParaEnviar = {
        ...formData,
        data_criacao: converterParaISO(formData.data_criacao),
        data_fechamento: converterParaISO(formData.data_fechamento)
      }
      
      console.log('📝 [FRONTEND] Dados convertidos para envio:', dadosParaEnviar);
      
      if (isEditing) {
        console.log(`📝 [FRONTEND] Enviando PUT para /api/negocios/${id}`);
        await axios.put(`/api/negocios/${id}`, dadosParaEnviar)
        console.log('✅ [FRONTEND] PUT bem-sucedido');
      } else {
        console.log('📝 [FRONTEND] Enviando POST para /api/negocios');
        const response = await axios.post('/api/negocios', dadosParaEnviar)
        console.log('✅ [FRONTEND] POST bem-sucedido. Resposta:', response.data);
      }
      
      console.log('✅ [FRONTEND] Redirecionando para /negocios');
      navigate('/negocios')
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao salvar:', error);
      console.error('❌ [FRONTEND] Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      const errorMessage = error.response?.data?.error || 'Erro ao salvar negócio. Tente novamente.';
      setError(errorMessage)
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
              onChange={(e) => {
                const formatado = autoFormatarTelefone(e.target.value)
                handleChange({ target: { name: 'telefone', value: formatado } })
              }}
              placeholder="(11) 99999-9999"
              maxLength="15"
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
            <select
              name="equipamento"
              value={formData.equipamento}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um equipamento</option>
              {EQUIPAMENTOS.map((equip) => (
                <option key={equip} value={equip}>
                  {equip}
                </option>
              ))}
            </select>
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

          {formData.tipo_negociacao !== 'Importação Direta' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Produto</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="text"
                  name="valor_produto"
                  value={exibirValorFormatado(formData.valor_produto)}
                  onChange={handleValorChange}
                  placeholder="0,00"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {formData.tipo_negociacao === 'Importação Direta' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Produto</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-gray-500">{getSimboloMoeda(formData.valor_produto_moeda)}</span>
                  <input
                    type="text"
                    name="valor_produto"
                    value={exibirValorFormatado(formData.valor_produto)}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  name="valor_produto_moeda"
                  value={formData.valor_produto_moeda}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          )}

          {formData.tipo_negociacao !== 'Importação Direta' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Oferta</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="text"
                  name="valor_oferta"
                  value={exibirValorFormatado(formData.valor_oferta)}
                  onChange={handleValorChange}
                  placeholder="0,00"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {formData.tipo_negociacao !== 'Importação Direta' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Fábrica</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="text"
                  name="valor_fabrica"
                  value={exibirValorFormatado(formData.valor_fabrica)}
                  onChange={handleValorChange}
                  placeholder="0,00"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {formData.tipo_negociacao === 'Importação Direta' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Fábrica</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-gray-500">{getSimboloMoeda(formData.valor_fabrica_moeda)}</span>
                  <input
                    type="text"
                    name="valor_fabrica"
                    value={exibirValorFormatado(formData.valor_fabrica)}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  name="valor_fabrica_moeda"
                  value={formData.valor_fabrica_moeda}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          )}

          {formData.tipo_negociacao !== 'Importação Direta' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Brasil</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">R$</span>
                <input
                  type="text"
                  name="valor_brasil"
                  value={exibirValorFormatado(formData.valor_brasil)}
                  onChange={handleValorChange}
                  placeholder="0,00"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {formData.tipo_negociacao === 'Importação Direta' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Brasil</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 text-gray-500">{getSimboloMoeda(formData.valor_brasil_moeda)}</span>
                  <input
                    type="text"
                    name="valor_brasil"
                    value={exibirValorFormatado(formData.valor_brasil)}
                    onChange={handleValorChange}
                    placeholder="0,00"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  name="valor_brasil_moeda"
                  value={formData.valor_brasil_moeda}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          )}


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Criação</label>
            <input
              type="text"
              name="data_criacao"
              value={formData.data_criacao}
              onChange={(e) => {
                const formatado = autoFormatarData(e.target.value)
                handleChange({ target: { name: 'data_criacao', value: formatado } })
              }}
              placeholder="DD/MM/YYYY"
              maxLength="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fechamento Esperada</label>
            <input
              type="text"
              name="data_fechamento"
              value={formData.data_fechamento}
              onChange={(e) => {
                const formatado = autoFormatarData(e.target.value)
                handleChange({ target: { name: 'data_fechamento', value: formatado } })
              }}
              placeholder="DD/MM/YYYY"
              maxLength="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
            <select
              name="etapa"
              value={formData.etapa}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione</option>
              <optgroup label="✨ NOVO PADRÃO">
                <option value="Contato Inicial">Contato Inicial</option>
                <option value="Cliente Contatado">Cliente Contatado</option>
                <option value="Proposta Enviada">Proposta Enviada</option>
                <option value="Prospecção">Prospecção</option>
              </optgroup>
              <optgroup label="⚠️ LEGADO (atualizar)">
                <option value="Contato inicial">Contato inicial</option>
                <option value="Cliente contatado">Cliente contatado</option>
                <option value="Proposta enviada">Proposta enviada</option>
                <option value="CANCELADO">CANCELADO</option>
                <option value="SUSPENSO">SUSPENSO</option>
                <option value="Parado">Parado</option>
                <option value="Sem etapa">Sem etapa</option>
              </optgroup>
            </select>
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
              <optgroup label="✨ NOVO PADRÃO">
                <option value="Em Andamento">Em Andamento</option>
                <option value="Parado">Parado</option>
                <option value="Perdido">Perdido</option>
                <option value="Venda Confirmada">Venda Confirmada</option>
                <option value="Encerrado">Encerrado</option>
                <option value="Suspenso">Suspenso</option>
              </optgroup>
              <optgroup label="⚠️ LEGADO (atualizar)">
                <option value="Em andamento">Em andamento</option>
                <option value="Contato inicial">Contato inicial</option>
                <option value="Proposta enviada">Proposta enviada</option>
                <option value="VENDA CONFIRMADA">VENDA CONFIRMADA</option>
                <option value="PERDIDO">PERDIDO</option>
                <option value="SUSPENSO">SUSPENSO</option>
                <option value="CANCELADO">CANCELADO</option>
                <option value="Em aberto">Em aberto</option>
                <option value="Prospecção">Prospecção</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Origem da Negociação</label>
            
            {/* Dropdown com as origens existentes */}
            <select
              value={formData.origem}
              onChange={(e) => handleChange({ target: { name: 'origem', value: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            >
              <option value="">Selecionar origem existente...</option>
              {origensDisponiveis.map((origem) => (
                <option key={origem} value={origem}>
                  {origem}
                </option>
              ))}
            </select>

            {/* OU - Input para criar nova origem */}
            <div className="relative">
              <input
                type="text"
                list="origens-sugestoes"
                placeholder="OU digite para criar nova origem..."
                onInput={(e) => {
                  if (e.target.value) {
                    handleChange({ target: { name: 'origem', value: e.target.value } })
                  }
                }}
                onBlur={(e) => {
                  const valorFormatado = toTitleCase(e.target.value)
                  if (valorFormatado && valorFormatado !== e.target.value) {
                    handleChange({ target: { name: 'origem', value: valorFormatado } })
                  }
                }}
                className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <datalist id="origens-sugestoes">
                {origensDisponiveis.map((origem) => (
                  <option key={origem} value={origem} />
                ))}
              </datalist>
            </div>

            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <span>⚠️</span>
              <span>Selecione acima OU digite uma nova origem. Formato recomendado: "Primeira Letra Maiúscula"</span>
            </p>
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

        {/* Sistema de Retornos Agendados */}
        {isEditing && (
          <RetornosAgendados 
            negocioId={id} 
            onRetornoRealizado={() => loadNegocio()}
          />
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
