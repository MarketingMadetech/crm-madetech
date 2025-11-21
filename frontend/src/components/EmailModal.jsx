import React, { useState } from 'react'
import axios from 'axios'

function EmailModal({ negocio, onClose, onEnviado }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    destinatario: '',
    assunto: `Proposta - ${negocio.equipamento || 'Equipamento'}`,
    mensagem: `Prezado(a) ${negocio.pessoa_contato || negocio.empresa},\n\nEm atenção à sua solicitação sobre ${negocio.equipamento || 'nossos equipamentos'}, segue proposta em anexo.\n\nFicamos à disposição para esclarecimentos.\n\nAtenciosamente,\nEquipe Madetech`
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEnviar = async () => {
    if (!formData.destinatario || !formData.assunto || !formData.mensagem) {
      alert('Preencha todos os campos!')
      return
    }

    setLoading(true)
    
    try {
      await axios.post('/api/email/enviar', {
        negocioId: negocio.id,
        ...formData
      })
      
      alert('✅ E-mail enviado com sucesso!')
      if (onEnviado) onEnviado()
      onClose()
    } catch (error) {
      console.error('Erro:', error)
      alert('❌ Erro ao enviar e-mail: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">✉️ Enviar E-mail</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3 mb-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Negócio:</strong> {negocio.empresa} - {negocio.equipamento}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              E-mail do Destinatário *
            </label>
            <input
              type="email"
              name="destinatario"
              value={formData.destinatario}
              onChange={handleChange}
              placeholder="cliente@empresa.com.br"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assunto *
            </label>
            <input
              type="text"
              name="assunto"
              value={formData.assunto}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mensagem *
            </label>
            <textarea
              name="mensagem"
              value={formData.mensagem}
              onChange={handleChange}
              rows="10"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ℹ️ O e-mail será enviado de: <strong>madetech.marketing@outlook.com</strong>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleEnviar}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : '📧 Enviar E-mail'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailModal
