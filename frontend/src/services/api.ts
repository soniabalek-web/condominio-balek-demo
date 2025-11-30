import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL || '/api',
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Só faz logout em 401 se for erro de autenticação (token inválido/expirado)
    // Não faz logout para outros erros
    if (error.response?.status === 401) {
      const mensagemErro = error.response?.data?.erro?.toLowerCase() || '';
      const urlErro = error.config?.url || '';

      // Faz logout apenas se for realmente um erro de token
      // Não faz logout se for apenas "não autorizado" para acessar um recurso específico
      if (mensagemErro.includes('token') || mensagemErro.includes('autenticação') || urlErro.includes('/auth/verificar')) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
