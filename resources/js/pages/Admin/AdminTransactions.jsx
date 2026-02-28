import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', method: '', search: '' });

    const fetch = async (page = 1) => {
        setLoading(true);
        const p = new URLSearchParams({ page, ...filters });
        try {
            const { data } = await axios.get(`/api/admin/transactions?${p}`);
            setTransactions(data.data);
            setPagination(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    const statusBadge = (status) => {
        const map = {
            paid:      { bg: 'bg-green-100 text-green-700', label: '✓ Payé' },
            pending:   { bg: 'bg-yellow-100 text-yellow-700', label: '⏳ Attente' },
            failed:    { bg: 'bg-red-100 text-red-700', label: '✗ Échoué' },
            cancelled: { bg: 'bg-gray-100 text-gray-600', label: '🚫 Annulé' },
        };
        const c = map[status] || { bg: 'bg-gray-100 text-gray-500', label: status };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg}`}>{c.label}</span>;
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Transactions</h1>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <input
                    type="text"
                    value={filters.search}
                    onChange={e => setFilters({...filters, search: e.target.value})}
                    placeholder="Référence ou email..."
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Tous les statuts</option>
                    <option value="paid">Payé</option>
                    <option value="pending">En attente</option>
                    <option value="failed">Échoué</option>
                    <option value="cancelled">Annulé</option>
                </select>
                <select value={filters.method} onChange={e => setFilters({...filters, method: e.target.value})}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Toutes méthodes</option>
                    <option value="fedapay">FedaPay</option>
                    <option value="kkiapay">KKiaPay</option>
                </select>
                <button onClick={() => fetch()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-all">
                    Filtrer
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Référence</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-600">Utilisateur</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-600">Document</th>
                                <th className="text-right px-4 py-4 font-semibold text-gray-600">Montant</th>
                                <th className="text-center px-4 py-4 font-semibold text-gray-600">Méthode</th>
                                <th className="text-center px-4 py-4 font-semibold text-gray-600">Statut</th>
                                <th className="text-right px-4 py-4 font-semibold text-gray-600">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="7" className="text-center py-12 text-gray-400">Chargement...</td></tr>
                            ) : transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.reference}</td>
                                    <td className="px-4 py-4">
                                        <div className="font-medium text-gray-900">{tx.user?.name}</div>
                                        <div className="text-xs text-gray-400">{tx.user?.email}</div>
                                    </td>
                                    <td className="px-4 py-4 text-gray-700 max-w-[200px] truncate">{tx.document?.title}</td>
                                    <td className="px-4 py-4 text-right font-bold text-gray-800">
                                        {Number(tx.amount).toLocaleString('fr-FR')} FCFA
                                    </td>
                                    <td className="px-4 py-4 text-center text-xs">
                                        {tx.method === 'fedapay' ? '📱 FedaPay' : '💳 KKiaPay'}
                                    </td>
                                    <td className="px-4 py-4 text-center">{statusBadge(tx.status)}</td>
                                    <td className="px-4 py-4 text-right text-xs text-gray-400">
                                        {new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
