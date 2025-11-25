// Utility functions para autenticação

const API_URL = 'http://localhost:3001/api';

export const auth = {
    // Verificar se está logado
    isAuthenticated() {
        const token = localStorage.getItem('token');
        return !!token;
    },

    // Pegar token
    getToken() {
        return localStorage.getItem('token');
    },

    // Pegar dados do usuário
    getUser() {
        return {
            username: localStorage.getItem('username'),
            role: localStorage.getItem('userRole')
        };
    },

    // Verificar se é admin
    isAdmin() {
        return localStorage.getItem('userRole') === 'admin';
    },

    // Login
    async login(username, password) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('userRole', data.user.role);
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, message: 'Erro ao conectar com o servidor' };
        }
    },

    // Logout
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        window.location.href = '/login.html';
    },

    // Verificar token no servidor
    async verifyToken() {
        const token = this.getToken();
        if (!token) return false;

        try {
            const response = await fetch(`${API_URL}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            return false;
        }
    }
};

// Interceptor para adicionar token em todas as requisições
export function setupAuthInterceptor() {
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
        const [url, options = {}] = args;
        
        // Adicionar token se existir
        const token = auth.getToken();
        if (token && !options.headers?.['Authorization']) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`
            };
        }

        return originalFetch(url, options)
            .then(response => {
                // Se retornar 401 (não autorizado), redirecionar para login
                if (response.status === 401 || response.status === 403) {
                    auth.logout();
                }
                return response;
            });
    };
}

// Middleware de proteção de rota
export function requireAuth() {
    if (!auth.isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

export default auth;
