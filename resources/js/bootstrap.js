import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.baseURL = window.APP_CONFIG?.appUrl || '';
window.axios.defaults.headers.common['Accept'] = 'application/json';

// Add token from localStorage
const token = localStorage.getItem('auth_token');
if (token) {
    window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Request interceptor
window.axios.interceptors.request.use(
    (config) => {
        const t = localStorage.getItem('auth_token');
        if (t) config.headers['Authorization'] = `Bearer ${t}`;
        config.headers['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]')?.content;
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle 401
window.axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
