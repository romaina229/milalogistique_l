import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const navItems = [
    { path: '/admin', label: 'Tableau de bord', icon: '📊', exact: true },
    { path: '/admin/documents', label: 'Documents', icon: '📄' },
    { path: '/admin/transactions', label: 'Transactions', icon: '💳' },
    { path: '/admin/users', label: 'Utilisateurs', icon: '👥' },
];

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        toast.success('Déconnecté');
        navigate('/');
    };

    const isActive = (item) =>
        item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

    return (
        <div className="min-h-screen flex bg-gray-100">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gradient-to-b from-blue-900 to-blue-800 text-white flex-shrink-0 transition-all duration-300 shadow-xl flex flex-col`}>
                {/* Logo */}
                <div className="p-4 border-b border-blue-700 flex items-center space-x-3">
                    <img src="/images/logomilla.jpeg" alt="Logo" className="w-9 h-9 rounded-full flex-shrink-0" />
                    {sidebarOpen && (
                        <div>
                            <div className="font-bold text-sm">Mila Admin</div>
                            <div className="text-xs text-blue-300">Administration</div>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg mb-1 transition-all text-sm font-medium ${
                                isActive(item)
                                    ? 'bg-white/20 text-white shadow-sm'
                                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            <span className="text-lg flex-shrink-0">{item.icon}</span>
                            {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-blue-700">
                    {sidebarOpen && (
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-medium truncate">{user?.name}</div>
                                <div className="text-xs text-blue-300">{user?.role}</div>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <Link to="/" className="flex-1 flex items-center justify-center space-x-1 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-xs transition-all">
                            {sidebarOpen && <span>Voir le site</span>}
                            <span>🌐</span>
                        </Link>
                        <button onClick={handleLogout} className="flex items-center justify-center bg-red-500/20 hover:bg-red-500/40 px-3 py-2 rounded-lg text-xs transition-all">
                            🚪
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Top bar */}
                <header className="bg-white shadow-sm h-16 flex items-center px-6 space-x-4 flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-semibold text-gray-800">
                        {navItems.find(i => isActive(i))?.label || 'Administration'}
                    </h1>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
