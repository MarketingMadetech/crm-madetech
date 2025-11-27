import React, { useRef, useState, useEffect } from 'react';
import api from '../utils/api';

export default function Backup() {
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await api.get('/backup/list');
      setBackups(response.data.backups);
    } catch (error) {
      showMessage('error', 'Erro ao carregar lista de backups');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    try {
      await api.post('/backup/create');
      showMessage('success', 'Backup criado com sucesso!');
      loadBackups();
    } catch (error) {
      showMessage('error', 'Erro ao criar backup');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = async (fileName) => {
    try {
      const response = await api.get(`/backup/download/${fileName}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showMessage('success', 'Download iniciado!');
    } catch (error) {
      showMessage('error', 'Erro ao fazer download do backup');
      console.error(error);
    }
  };

  const restoreBackup = async (fileName) => {
    if (!window.confirm(`Tem certeza que deseja restaurar o backup "${fileName}"?\n\nISSO IRÁ SUBSTITUIR TODOS OS DADOS ATUAIS!`)) {
      return;
    }
    setLoading(true);
    try {
      await api.post(`/backup/restore/${fileName}`);
      showMessage('success', 'Backup restaurado! Recarregue a página para ver as mudanças.');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      showMessage('error', 'Erro ao restaurar backup');
      console.error(error);
      setLoading(false);
    }
  };

  const deleteBackup = async (fileName) => {
    if (!window.confirm(`Tem certeza que deseja deletar o backup "${fileName}"?`)) {
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/backup/delete/${fileName}`);
      showMessage('success', 'Backup deletado com sucesso!');
      loadBackups();
    } catch (error) {
      showMessage('error', 'Erro ao deletar backup');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Upload e restauração de backup por arquivo
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm(`Tem certeza que deseja restaurar o backup a partir do arquivo "${file.name}"?\n\nISSO IRÁ SUBSTITUIR TODOS OS DADOS ATUAIS!`)) {
      fileInputRef.current.value = '';
      return;
    }
    setUploading(true);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('backup', file);
      await api.post('/backup/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMessage('success', 'Backup restaurado do arquivo! Recarregue a página para ver as mudanças.');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      showMessage('error', 'Erro ao restaurar backup do arquivo');
      console.error(error);
      setLoading(false);
    } finally {
      setUploading(false);
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          💾 Gerenciamento de Backups
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Crie, restaure e gerencie backups do banco de dados
        </p>
      </div>

      {/* Mensagens */}
      {message.text && (
        <div
          className={
            'mb-4 p-4 rounded-lg ' +
            (message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200')
          }
        >
          {message.text}
        </div>
      )}

      {/* Botão Criar Backup e Upload */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Criar Novo Backup
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Crie um backup manual do banco de dados atual ou restaure a partir de um arquivo .db
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <button
              onClick={createBackup}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processando...
                </>
              ) : (
                <>
                  <span>➕</span>
                  Criar Backup
                </>
              )}
            </button>
            <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
              <input
                type="file"
                accept=".db"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              {uploading ? (
                <span className="animate-spin">♻️</span>
              ) : (
                <span>⬆️</span>
              )}
              Restaurar por Arquivo
            </label>
          </div>
        </div>
      </div>

      {/* Info sobre backup automático */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Backup Automático Ativo
            </h3>
            <p className="text-blue-800 dark:text-blue-300 text-sm">
              O sistema cria automaticamente um backup todos os dias às 3h da manhã.
              Os últimos 30 backups são mantidos automaticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Backups */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Backups Disponíveis ({backups.length})
          </h2>
        </div>

        {loading && backups.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Carregando backups...
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Nenhum backup encontrado. Crie o primeiro backup acima!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nome do Arquivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tamanho
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {backups.map((backup) => (
                  <tr key={backup.fileName} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">💾</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {backup.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(backup.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatBytes(backup.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => downloadBackup(backup.fileName)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="Download"
                        >
                          ⬇️ Baixar
                        </button>
                        <button
                          onClick={() => restoreBackup(backup.fileName)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 px-3 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/30"
                          title="Restaurar"
                        >
                          ♻️ Restaurar
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.fileName)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Deletar"
                        >
                          🗑️ Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Avisos de segurança */}
      <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
              Importante sobre Restauração
            </h3>
            <ul className="text-yellow-800 dark:text-yellow-300 text-sm list-disc list-inside space-y-1">
              <li>Restaurar um backup irá <strong>substituir todos os dados atuais</strong></li>
              <li>Um backup do estado atual é criado automaticamente antes da restauração</li>
              <li>Após restaurar, é recomendado recarregar a página ou reiniciar o servidor</li>
              <li>Faça download dos backups importantes para armazenamento externo</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
