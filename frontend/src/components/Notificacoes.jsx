import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState([])
  const [mostrar, setMostrar] = useState(false)
  const [lidas, setLidas] = useState(() => {
    const storage = localStorage.getItem('notificacoes_lidas')
    return storage ? JSON.parse(storage) : []
  })

  useEffect(() => {
    carregarNotificacoes()
    const intervalo = setInterval(carregarNotificacoes, 300000) // Atualiza a cada 5 min
    return () => clearInterval(intervalo)
  }, [])

  const carregarNotificacoes = async () => {
    try {
      const res = await axios.get('/api/negocios', { params: { status: 'Em andamento' } })
      const negocios = res.data
      const hoje = new Date()
      const alerts = []

      negocios.forEach(n => {
        // Parse de data
        const parseData = (dataStr) => {
          if (!dataStr) return null
          if (dataStr.includes('-')) return new Date(dataStr.split(' ')[0])
          const [dia, mes, ano] = dataStr.split('/')
          return new Date(ano, mes - 1, dia)
        }

        const dataCriacao = parseData(n.data_criacao)
        const dataFechamento = parseData(n.data_fechamento)

        // Alertas para negócios parados > 30 dias
        if (dataCriacao) {
          const diasParados = Math.floor((hoje - dataCriacao) / (1000 * 60 * 60 * 24))
          if (diasParados > 30 && n.etapa === 'Contato inicial') {
            alerts.push({
              id: `parado-${n.id}`,
              tipo: 'parado',
              negocio: n,
              mensagem: `${n.empresa} está parado há ${diasParados} dias`,
              urgencia: diasParados > 60 ? 'alta' : 'media',
              icone: '⚠️'
            })
          }
        }

        // Alertas para fechamento próximo
        if (dataFechamento) {
          const diasParaFechamento = Math.floor((dataFechamento - hoje) / (1000 * 60 * 60 * 24))
          if (diasParaFechamento >= 0 && diasParaFechamento <= 7) {
            alerts.push({
              id: `fechamento-${n.id}`,
              tipo: 'fechamento',
              negocio: n,
              mensagem: `${n.empresa} fecha em ${diasParaFechamento} ${diasParaFechamento === 1 ? 'dia' : 'dias'}`,
              urgencia: diasParaFechamento <= 3 ? 'alta' : 'media',
              icone: '📅'
            })
          }
        }

        // Alertas para propostas antigas
        if (dataCriacao && n.etapa && n.etapa.toLowerCase().includes('proposta')) {
          const diasProposta = Math.floor((hoje - dataCriacao) / (1000 * 60 * 60 * 24))
          if (diasProposta > 14) {
            alerts.push({
              id: `proposta-${n.id}`,
              tipo: 'proposta',
              negocio: n,
              mensagem: `Proposta de ${n.empresa} sem retorno há ${diasProposta} dias`,
              urgencia: diasProposta > 30 ? 'alta' : 'media',
              icone: '📧'
            })
          }
        }
      })

      setNotificacoes(alerts)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  const marcarComoLida = (id) => {
    const novasLidas = [...lidas, id]
    setLidas(novasLidas)
    localStorage.setItem('notificacoes_lidas', JSON.stringify(novasLidas))
  }

  const marcarTodasComoLidas = () => {
    const ids = notificacoes.map(n => n.id)
    setLidas(ids)
    localStorage.setItem('notificacoes_lidas', JSON.stringify(ids))
  }

  const notificacoesNaoLidas = notificacoes.filter(n => !lidas.includes(n.id))
  const totalNaoLidas = notificacoesNaoLidas.length

  const getCorUrgencia = (urgencia) => {
    switch (urgencia) {
      case 'alta': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200'
      case 'media': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200'
      default: return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200'
    }
  }

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <button
        onClick={() => setMostrar(!mostrar)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        🔔
        {totalNaoLidas > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {totalNaoLidas}
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      {mostrar && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setMostrar(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 max-h-[500px] overflow-y-auto border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notificações {totalNaoLidas > 0 && `(${totalNaoLidas})`}
              </h3>
              {totalNaoLidas > 0 && (
                <button
                  onClick={marcarTodasComoLidas}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Lista de notificações */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notificacoes.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Nenhuma notificação no momento 🎉
                </div>
              ) : (
                notificacoes.map((notif) => {
                  const lida = lidas.includes(notif.id)
                  return (
                    <Link
                      key={notif.id}
                      to={`/negocios/${notif.negocio.id}/editar`}
                      className={`block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !lida ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                      onClick={() => {
                        marcarComoLida(notif.id)
                        setMostrar(false)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{notif.icone}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            !lida ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {notif.mensagem}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                              getCorUrgencia(notif.urgencia)
                            }`}>
                              {notif.urgencia === 'alta' ? 'Urgente' : 'Atenção'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {notif.negocio.etapa}
                            </span>
                          </div>
                        </div>
                        {!lida && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                    </Link>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {notificacoes.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
                <Link
                  to="/lembretes"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={() => setMostrar(false)}
                >
                  Ver todos os lembretes →
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Notificacoes
