import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/admin/users')
            .then(res => setUsers(res.data.data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Utilisateurs ({users.length})</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-6 py-4 font-semibold text-gray-600">Nom</th>
                            <th className="text-left px-4 py-4 font-semibold text-gray-600">Email</th>
                            <th className="text-left px-4 py-4 font-semibold text-gray-600">Téléphone</th>
                            <th className="text-center px-4 py-4 font-semibold text-gray-600">Transactions</th>
                            <th className="text-center px-4 py-4 font-semibold text-gray-600">Statut</th>
                            <th className="text-right px-4 py-4 font-semibold text-gray-600">Inscrit le</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-12 text-gray-400">Chargement...</td></tr>
                        ) : users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                <td className="px-4 py-4 text-gray-600">{user.email}</td>
                                <td className="px-4 py-4 text-gray-500">{user.phone || '—'}</td>
                                <td className="px-4 py-4 text-center font-semibold text-blue-600">{user.transactions_count}</td>
                                <td className="px-4 py-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {user.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-right text-xs text-gray-400">
                                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
