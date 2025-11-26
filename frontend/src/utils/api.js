import axios from 'axios';
import auth from '../auth';

// Cria uma instância do axios com configurações pré-definidas
const api = axios.create({
  baseURL: '/api' // A base de todas as URLs da API
});

// Interceptor de Requisição: Adiciona o token em cada chamada
api.interceptors.request.use(
  config => {
    const token = auth.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor de Resposta: Lida com erros de autenticação (ex: token expirado)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Se o token for inválido, desloga o usuário
      auth.logout();
    }
    return Promise.reject(error);
  }
);

export default api;
