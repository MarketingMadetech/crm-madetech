import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'

function Notificacoes() {
  const [retornos, setRetornos] = useState({ atrasados: [], hoje: [], proximos: [] })
  const [mostrar, setMostrar] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarRetornos()
    const intervalo = setInterval(carregarRetornos, 60000) // Atualiza a cada 1 min
    return () => clearInterval(intervalo)
  }, [])

  const carregarRetornos = async () => {
    try {
      const res = await api.get('/retornos/pendentes')
      setRetornos(res.data)
    } catch (error) {
      console.error('Erro ao carregar retornos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (dataStr) => {
    if (!dataStr) return ''
    const data = new Date(dataStr + 'T00:00:00')
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const totalPendentes = retornos.atrasados.length + retornos.hoje.length + retornos.proximos.length
  const temUrgentes = retornos.atrasados.length > 0 || retornos.hoje.length > 0

  return (
    <div className="relative">
      {/* Botão do sininho */}
      <button
        onClick={() => setMostrar(!mostrar)}
        className={`relative p-2 rounded-full transition-colors ${
          temUrgentes 
            ? 'hover:bg-red-100 dark:hover:bg-red-900/30' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        title="Retornos Agendados"
      >
        <span className={temUrgentes ? 'animate-pulse' : ''}>🔔</span>
        {totalPendentes > 0 && (
          <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white rounded-full ${
            retornos.atrasados.length > 0 ? 'bg-red-600' : retornos.hoje.length > 0 ? 'bg-amber-500' : 'bg-blue-600'
          }`}>
            {totalPendentes > 99 ? '99+' : totalPendentes}
          </span>
        )}
      </button>

      {/* Dropdown de retornos */}
      {mostrar && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setMostrar(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                📅 Retornos Agendados
                {totalPendentes > 0 && (
                  <span className="text-sm bg-blue-600 text-white px-2 py-0.5 rounded-full">{totalPendentes}</span>
                )}
              </h3>
            </div>

            {/* Conteúdo */}
            <div className="overflow-y-auto max-h-[380px]">
              {loading ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <span className="inline-block animate-spin text-2xl">⏳</span>
                  <p className="mt-2">Carregando...</p>
                </div>
              ) : totalPendentes === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">🎉</div>
                  <p>Nenhum retorno pendente!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* Atrasados */}
                  {retornos.atrasados.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20">
                      <div className="px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                        🔴 Atrasados ({retornos.atrasados.length})
                      </div>
                      {retornos.atrasados.slice(0, 3).map((r) => (
                        <Link
                          key={r.id}
                          to={`/negocios/${r.negocio_id}/editar`}
                          className="block px-4 py-3 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border-t border-red-200 dark:border-red-800"
                          onClick={() => setMostrar(false)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{r.empresa}</p>
                              {r.descricao && <p className="text-sm text-gray-600 dark:text-gray-400 truncate">📝 {r.descricao}</p>}
                            </div>
                            <span className="text-xs text-red-600 dark:text-red-400 whitespace-nowrap">{formatarData(r.data_agendada)}</span>
                          </div>
                        </Link>
                      ))}
                      {retornos.atrasados.length > 3 && (
                        <div className="px-4 py-2 text-xs text-red-600 dark:text-red-400 text-center border-t border-red-200 dark:border-red-800">
                          +{retornos.atrasados.length - 3} mais atrasados
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hoje */}
                  {retornos.hoje.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20">
                      <div className="px-4 py-2 text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                        🟡 Para Hoje ({retornos.hoje.length})
                      </div>
                      {retornos.hoje.slice(0, 3).map((r) => (
                        <Link
                          key={r.id}
                          to={`/negocios/${r.negocio_id}/editar`}
                          className="block px-4 py-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors border-t border-amber-200 dark:border-amber-800"
                          onClick={() => setMostrar(false)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{r.empresa}</p>
                              {r.descricao && <p className="text-sm text-gray-600 dark:text-gray-400 truncate">📝 {r.descricao}</p>}
                            </div>
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">HOJE</span>
                          </div>
                        </Link>
                      ))}
                      {retornos.hoje.length > 3 && (
                        <div className="px-4 py-2 text-xs text-amber-600 dark:text-amber-400 text-center border-t border-amber-200 dark:border-amber-800">
                          +{retornos.hoje.length - 3} mais para hoje
                        </div>
                      )}
                    </div>
                  )}

                  {/* Próximos */}
                  {retornos.proximos.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20">
                        🔵 Próximos ({retornos.proximos.length})
                      </div>
                      {retornos.proximos.slice(0, 3).map((r) => (
                        <Link
                          key={r.id}
                          to={`/negocios/${r.negocio_id}/editar`}
                          className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
                          onClick={() => setMostrar(false)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{r.empresa}</p>
                              {r.descricao && <p className="text-sm text-gray-600 dark:text-gray-400 truncate">📝 {r.descricao}</p>}
                            </div>
                            <span className="text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">{formatarData(r.data_agendada)}</span>
                          </div>
                        </Link>
                      ))}
                      {retornos.proximos.length > 3 && (
                        <div className="px-4 py-2 text-xs text-blue-600 dark:text-blue-400 text-center border-t border-gray-200 dark:border-gray-700">
                          +{retornos.proximos.length - 3} próximos
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Link para página completa */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center">
              <Link
                to="/lembretes"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => setMostrar(false)}
              >
                Ver todos os retornos →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Notificacoes
