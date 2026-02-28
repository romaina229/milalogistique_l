import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' });
    const { login, loading } = useAuthStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(form.email, form.password);
        if (result.success) {
            toast.success(`Bienvenue, ${result.user.name} !`);
            navigate(result.user.is_admin ? '/admin' : redirect);
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img src="/images/logomilla.jpeg" alt="Logo" className="w-16 h-16 rounded-full mx-auto mb-4 shadow-md" />
                    <h1 className="text-3xl font-extrabold text-gray-900">Connexion</h1>
                    <p className="text-gray-500 mt-1">Accédez à votre espace personnel</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={e => setForm({...form, email: e.target.value})}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                                placeholder="vous@exemple.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mot de passe</label>
                            <input
                                type="password"
                                required
                                value={form.password}
                                onChange={e => setForm({...form, password: e.target.value})}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white py-3 rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg disabled:opacity-70"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center space-x-2">
                                    <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                                    <span>Connexion...</span>
                                </span>
                            ) : 'Se connecter'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Pas encore de compte ?{' '}
                        <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold">
                            Créer un compte
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const { register, loading } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        const result = await register(form);
        if (result.success) {
            toast.success('Compte créé avec succès ! Bienvenue 🎉');
            navigate('/documents');
        } else {
            toast.error(result.error);
            if (result.errors) setErrors(result.errors);
        }
    };

    const field = (name, label, type = 'text', placeholder = '') => (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
            <input
                type={type}
                value={form[name]}
                onChange={e => setForm({...form, [name]: e.target.value})}
                className={`w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all ${
                    errors[name] ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500'
                }`}
                placeholder={placeholder}
            />
            {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name][0]}</p>}
        </div>
    );

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <img src="/images/logomilla.jpeg" alt="Logo" className="w-16 h-16 rounded-full mx-auto mb-4 shadow-md" />
                    <h1 className="text-3xl font-extrabold text-gray-900">Créer un compte</h1>
                    <p className="text-gray-500 mt-1">Rejoignez Mila Logistique</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {field('name', 'Nom complet', 'text', 'Jean Dupont')}
                        {field('email', 'Email', 'email', 'vous@exemple.com')}
                        {field('phone', 'Téléphone (optionnel)', 'tel', '+229 01 ...')}
                        {field('password', 'Mot de passe', 'password', 'Minimum 8 caractères')}
                        {field('password_confirmation', 'Confirmer le mot de passe', 'password', '••••••••')}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white py-3 rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg disabled:opacity-70 mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center space-x-2">
                                    <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                                    <span>Création...</span>
                                </span>
                            ) : 'Créer mon compte'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Déjà un compte ?{' '}
                        <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
