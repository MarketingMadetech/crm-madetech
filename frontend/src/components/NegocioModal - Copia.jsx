import React from 'react'

function NegocioModal({ negocio, onClose }) {
  if (!negocio) return null

  const formatCurrency = (value) => {
    if (!value) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

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
                <p className="text-gray-900 dark:text-white font-medium">{negocio.data_criacao || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Fechamento Esperado:</span>
                <p className="text-gray-900 dark:text-white font-medium">{negocio.data_fechamento || '-'}</p>
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

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NegocioModal
