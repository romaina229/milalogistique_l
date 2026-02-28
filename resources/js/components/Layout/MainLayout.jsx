import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function MainLayout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { user, logout, isAuthenticated, isAdmin } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        toast.success('Déconnecté avec succès');
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Navbar */}
            <nav className="bg-gradient-to-r from-blue-900 to-blue-700 shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-3 flex-shrink-0">
                            <img
                                src="/images/logomilla.jpeg"
                                alt="Milla Logistique"
                                className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                            />
                            <div className="text-white">
                                <div className="font-bold text-lg leading-tight">Milla Logistique</div>
                                <div className="text-xs text-blue-200 leading-tight">Documents professionnels</div>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center space-x-1">
                            <NavLink to="/" active={isActive('/')}>Accueil</NavLink>
                            <NavLink to="/documents" active={isActive('/documents')}>Documents</NavLink>
                            {isAuthenticated() && (
                                <NavLink to="/my-documents" active={isActive('/my-documents')}>Mes Documents</NavLink>
                            )}
                            <NavLink to="/faq" active={isActive('/faq')}>FAQ</NavLink>
                            <NavLink to="/contact" active={isActive('/contact')}>Contact</NavLink>
                        </div>

                        {/* Auth buttons */}
                        <div className="hidden md:flex items-center space-x-3">
                            {isAuthenticated() ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-all"
                                    >
                                        <div className="w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium">{user?.name}</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                                            <DropdownItem to="/profile" icon="👤" onClick={() => setDropdownOpen(false)}>Mon profil</DropdownItem>
                                            <DropdownItem to="/my-documents" icon="📥" onClick={() => setDropdownOpen(false)}>Mes documents</DropdownItem>
                                            <DropdownItem to="/transactions" icon="💳" onClick={() => setDropdownOpen(false)}>Transactions</DropdownItem>
                                            {isAdmin() && (
                                                <>
                                                    <div className="border-t border-gray-100 my-1" />
                                                    <DropdownItem to="/admin" icon="⚙️" onClick={() => setDropdownOpen(false)}>Administration</DropdownItem>
                                                </>
                                            )}
                                            <div className="border-t border-gray-100 my-1" />
                                            <button
                                                onClick={() => { setDropdownOpen(false); handleLogout(); }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                            >
                                                <span>🚪</span>
                                                <span>Déconnexion</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link to="/login" className="text-white/90 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
                                        Connexion
                                    </Link>
                                    <Link to="/register" className="bg-white text-blue-800 text-sm font-semibold px-5 py-2 rounded-full hover:bg-blue-50 transition-all shadow-sm">
                                        S'inscrire
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden text-white p-2"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {menuOpen
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                }
                            </svg>
                        </button>
                    </div>

                    {/* Mobile menu */}
                    {menuOpen && (
                        <div className="md:hidden py-4 border-t border-blue-600">
                            <div className="flex flex-col space-y-1">
                                <MobileNavLink to="/" onClick={() => setMenuOpen(false)}>Accueil</MobileNavLink>
                                <MobileNavLink to="/documents" onClick={() => setMenuOpen(false)}>Documents</MobileNavLink>
                                {isAuthenticated() && (
                                    <MobileNavLink to="/my-documents" onClick={() => setMenuOpen(false)}>Mes Documents</MobileNavLink>
                                )}
                                <MobileNavLink to="/faq" onClick={() => setMenuOpen(false)}>FAQ</MobileNavLink>
                                <MobileNavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</MobileNavLink>
                                <div className="pt-2 border-t border-blue-600 flex space-x-2">
                                    {isAuthenticated() ? (
                                        <button onClick={handleLogout} className="w-full bg-red-500/20 text-white px-4 py-2 rounded-lg text-sm">
                                            Déconnexion
                                        </button>
                                    ) : (
                                        <>
                                            <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center bg-white/10 text-white px-4 py-2 rounded-lg text-sm">
                                                Connexion
                                            </Link>
                                            <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center bg-white text-blue-800 px-4 py-2 rounded-lg text-sm font-semibold">
                                                S'inscrire
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Page content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 mt-auto">
                <div className="container mx-auto px-4 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <div className="flex items-center space-x-3 mb-4">
                                <img src="/images/logomilla.jpeg" alt="Logo" className="w-10 h-10 rounded-full" />
                                <span className="text-white font-bold text-lg">Milla Logistique</span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                Votre plateforme de documents professionnels logistiques au Bénin.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-3">Liens rapides</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/documents" className="hover:text-white transition-colors">Documents</Link></li>
                                <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold mb-3">Contact</h3>
                            <ul className="space-y-2 text-sm">
                                <li>📍 Cotonou, Bénin</li>
                                <li>📞 +229 01 52 75 56 08</li>
                                <li>✉️ milalogistique@gmail.com</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
                        © {new Date().getFullYear()} Milla Logistique. Tous droits réservés.
                    </div>
                </div>
            </footer>
        </div>
    );
}

function NavLink({ to, active, children }) {
    return (
        <Link
            to={to}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
        >
            {children}
        </Link>
    );
}

function MobileNavLink({ to, onClick, children }) {
    return (
        <Link to={to} onClick={onClick} className="text-white/90 hover:text-white px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition-all">
            {children}
        </Link>
    );
}

function DropdownItem({ to, icon, children, onClick }) {
    return (
        <Link to={to} onClick={onClick} className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <span>{icon}</span>
            <span>{children}</span>
        </Link>
    );
}
