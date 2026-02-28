import { create } from 'zustand';
import axios from 'axios';

export const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
    token: localStorage.getItem('auth_token'),
    loading: false,
    error: null,

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const { data } = await axios.post('/api/auth/login', { email, password });
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            set({ user: data.user, token: data.token, loading: false });
            return { success: true, user: data.user };
        } catch (err) {
            const msg = err.response?.data?.error || 'Erreur de connexion';
            set({ error: msg, loading: false });
            return { success: false, error: msg };
        }
    },

    register: async (formData) => {
        set({ loading: true, error: null });
        try {
            const { data } = await axios.post('/api/auth/register', formData);
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
            set({ user: data.user, token: data.token, loading: false });
            return { success: true };
        } catch (err) {
            const errors = err.response?.data?.errors || {};
            const msg = err.response?.data?.message || 'Erreur lors de l\'inscription';
            set({ error: msg, loading: false });
            return { success: false, error: msg, errors };
        }
    },

    logout: async () => {
        try {
            await axios.post('/api/auth/logout');
        } catch {}
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        delete axios.defaults.headers.common['Authorization'];
        set({ user: null, token: null });
    },

    fetchMe: async () => {
        try {
            const { data } = await axios.get('/api/auth/me');
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            set({ user: data.user });
        } catch {
            get().logout();
        }
    },

    isAuthenticated: () => !!get().token,
    isAdmin: () => get().user?.is_admin || false,
}));
