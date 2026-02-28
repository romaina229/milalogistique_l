import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, fetchMe } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
    const [passwords, setPasswords] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [saving, setSaving] = useState(false);

    const saveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put('/api/auth/profile', profile);
            await fetchMe();
            toast.success('Profil mis à jour avec succès');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const savePassword = async (e) => {
        e.preventDefault();
        if (passwords.password !== passwords.password_confirmation) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }
        setSaving(true);
        try {
            await axios.put('/api/auth/password', passwords);
            toast.success('Mot de passe modifié');
            setPasswords({ current_password: '', password: '', password_confirmation: '' });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Mot de passe actuel incorrect');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-10 max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Mon profil</h1>

            {/* Avatar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center space-x-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="text-xl font-bold text-gray-900">{user?.name}</div>
                    <div className="text-gray-500 text-sm">{user?.email}</div>
                    <div className="mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            user?.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                            {user?.is_admin ? '⚙️ Admin' : '👤 Client'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                {[
                    { id: 'profile', label: 'Informations' },
                    { id: 'password', label: 'Mot de passe' },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                            activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                {activeTab === 'profile' && (
                    <form onSubmit={saveProfile} className="space-y-5">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Informations personnelles</h2>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom complet</label>
                            <input type="text" required value={profile.name}
                                onChange={e => setProfile({...profile, name: e.target.value})}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                            <input type="email" disabled value={user?.email}
                                className="w-full border border-gray-100 rounded-xl px-4 py-3 bg-gray-50 text-gray-400 text-sm cursor-not-allowed" />
                            <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone</label>
                            <input type="tel" value={profile.phone}
                                onChange={e => setProfile({...profile, phone: e.target.value})}
                                placeholder="+229 01 23 45 67 89"
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                        </div>

                        <button type="submit" disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-60">
                            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>
                    </form>
                )}

                {activeTab === 'password' && (
                    <form onSubmit={savePassword} className="space-y-5">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Changer le mot de passe</h2>

                        {[
                            { key: 'current_password', label: 'Mot de passe actuel', placeholder: '••••••••' },
                            { key: 'password', label: 'Nouveau mot de passe', placeholder: 'Minimum 8 caractères' },
                            { key: 'password_confirmation', label: 'Confirmer le nouveau mot de passe', placeholder: '••••••••' },
                        ].map(field => (
                            <div key={field.key}>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label}</label>
                                <input type="password" required value={passwords[field.key]}
                                    onChange={e => setPasswords({...passwords, [field.key]: e.target.value})}
                                    placeholder={field.placeholder}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
                            </div>
                        ))}

                        <button type="submit" disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-60">
                            {saving ? 'Modification...' : 'Modifier le mot de passe'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
