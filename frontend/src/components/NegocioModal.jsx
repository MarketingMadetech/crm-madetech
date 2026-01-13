import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { formatarDataBrasileira } from '../utils/dateUtils'

function NegocioModal({ negocio, onClose }) {
  const [historico, setHistorico] = useState([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(true)

  useEffect(() => {
    if (negocio?.id) {
      carregarHistorico()
    }
  }, [negocio?.id])

  const carregarHistorico = async () => {
    try {
      const res = await axios.get(`/api/historico/${negocio.id}`)
      setHistorico(res.data)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setCarregandoHistorico(false)
    }
  }

  if (!negocio) return null

  const formatCurrency = (value) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Usar função importada de dateUtils
  const formatarData = formatarDataBrasileira

  const getStatusColor = (status) => {
    const colors = {
      'Venda Confirmada': 'bg-green-100 text-green-800 border-green-200',
      'Em andamento': 'bg-blue-100 text-blue-800 border-blue-200',
      'Perdido': 'bg-red-100 text-red-800 border-red-200',
      'Suspenso': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Cancelado': 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{negocio.empresa}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status e Etapa */}
          <div className="flex gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(negocio.status)}`}>
              {negocio.status || 'Sem status'}
            </span>
            {negocio.etapa && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                {negocio.etapa}
              </span>
            )}
          </div>

          {/* Informações do Contato */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">👤 Informações de Contato</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Pessoa de Contato:</span>
                <p className="text-gray-900 dark:text-white font-medium">{negocio.pessoa_contato || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Telefone:</span>
                <p className="text-gray-900 dark:text-white font-medium">
                  {negocio.telefone ? (
                    <a href={`tel:${negocio.telefone}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                      {negocio.telefone}
                    </a>
                  ) : '-'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Origem:</span>
                <p className="text-gray-900 dark:text-white font-medium">{negocio.origem || '-'}</p>
              </div>
            </div>
          </div>

          {/* Informações do Produto */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">🔧 Produto/Equipamento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Equipamento:</span>
                <p className="text-gray-900 dark:text-white font-medium">{negocio.equipamento || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Tipo da Máquina:</span>
                <p className="text-gray-900 dark:text-white font-medium">{negocio.tipo_maquina || '-'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tipo de Negociação:</span>
                <p className="text-gray-900 dark:text-white font-medium">{negocio.tipo_negociacao || '-'}</p>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">💰 Valores</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Valor do Produto:</span>
                <p className="text-gray-900 dark:text-white font-semibold text-lg">{formatCurrency(negocio.valor_produto)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Valor da Oferta:</span>
                <p className="text-blue-600 dark:text-blue-400 font-semibold text-lg">{formatCurrency(negocio.valor_oferta)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Valor Fábrica:</span>
                <p className="text-gray-900 dark:text-white font-medium">{formatCurrency(negocio.valor_fabrica)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Valor Brasil:</span>
                <p className="text-gray-900 dark:text-white font-medium">{formatCurrency(negocio.valor_brasil)}</p>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📅 Datas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Negócio Criado em:</span>
                <p className="text-gray-900 dark:text-white font-medium">{formatarData(negocio.data_criacao)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Fechamento Esperado:</span>
                <p className="text-gray-900 dark:text-white font-medium">{formatarData(negocio.data_fechamento)}</p>
              </div>
            </div>
          </div>

          {/* Observações */}
          {negocio.observacao && (
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📝 Observações</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{negocio.observacao}</p>
            </div>
          )}

          {/* Histórico de Ocorrências */}
          {negocio.ocorrencias && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📋 Histórico de Ocorrências</h3>
              <div className="space-y-2">
                {negocio.ocorrencias.split('\n').filter(o => o.trim()).map((ocorrencia, index) => {
                  const match = ocorrencia.match(/\[(\d{2}\/\d{2}\/\d{4})\]\s*(.+)/);
                  if (match) {
                    const [, data, descricao] = match;
                    return (
                      <div key={index} className="flex gap-3 items-start border-l-2 border-purple-300 dark:border-purple-700 pl-3 py-1">
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">{data}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{descricao}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="text-sm text-gray-700 dark:text-gray-300 pl-3">{ocorrencia}</div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Histórico de Atividades */}
          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📜 Histórico de Atividades</h3>
            {carregandoHistorico ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando histórico...</p>
            ) : historico.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma atividade registrada ainda.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {historico.map((item, index) => {
                  const isUltimo = index === historico.length - 1
                  const icone = item.tipo_acao === 'criacao' ? '🆕' : 
                               item.tipo_acao === 'atualizacao' ? '✏️' : 
                               item.tipo_acao === 'exclusao' ? '🗑️' : '📝'
                  const cor = item.tipo_acao === 'criacao' ? 'text-green-600 dark:text-green-400' : 
                             item.tipo_acao === 'atualizacao' ? 'text-blue-600 dark:text-blue-400' : 
                             item.tipo_acao === 'exclusao' ? 'text-red-600 dark:text-red-400' : 
                             'text-gray-600 dark:text-gray-400'
                  
                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-lg">{icone}</span>
                        {!isUltimo && <div className="w-px h-full bg-gray-300 dark:bg-gray-600 mt-1"></div>}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`text-sm font-medium ${cor}`}>
                              {item.tipo_acao === 'criacao' && 'Negócio criado'}
                              {item.tipo_acao === 'atualizacao' && `${item.campo_alterado} alterado`}
                              {item.tipo_acao === 'exclusao' && 'Negócio excluído'}
                            </p>
                            {item.tipo_acao === 'atualizacao' && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                <span className="line-through">{item.valor_anterior || '-'}</span>
                                {' → '}
                                <span className="font-medium">{item.valor_novo || '-'}</span>
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(item.data_hora).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Fechar
            </button>
            <Link
              to={`/negocios/${negocio.id}/editar`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              ✏️ Editar Negócio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NegocioModal
