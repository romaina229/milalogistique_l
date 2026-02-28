import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/admin/dashboard')
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const { stats, recent_transactions, top_documents } = data;

    const statCards = [
        { label: 'Documents actifs', value: stats.active_documents, total: stats.total_documents, icon: '📄', color: 'blue' },
        { label: 'Utilisateurs', value: stats.total_users, icon: '👥', color: 'purple' },
        { label: 'Transactions payées', value: stats.paid_transactions, total: stats.total_transactions, icon: '✅', color: 'green' },
        { label: 'Revenu total', value: `${Number(stats.total_revenue).toLocaleString('fr-FR')} FCFA`, icon: '💰', color: 'yellow' },
        { label: 'Revenu aujourd\'hui', value: `${Number(stats.today_revenue).toLocaleString('fr-FR')} FCFA`, icon: '📅', color: 'orange' },
        { label: 'Revenu du mois', value: `${Number(stats.monthly_revenue).toLocaleString('fr-FR')} FCFA`, icon: '📊', color: 'indigo' },
    ];

    const colorMap = {
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        green: 'bg-green-50 border-green-200 text-green-700',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        orange: 'bg-orange-50 border-orange-200 text-orange-700',
        indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    };

    const statusBadge = (status) => ({
        paid:      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">✓ Payé</span>,
        pending:   <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">⏳ Attente</span>,
        failed:    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">✗ Échoué</span>,
        cancelled: <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">🚫 Annulé</span>,
    }[status] || <span className="text-xs text-gray-400">{status}</span>);

    return (
        <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className={`border rounded-2xl p-5 ${colorMap[card.color]}`}>
                        <div className="text-3xl mb-2">{card.icon}</div>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <div className="text-sm opacity-80 mt-1">{card.label}</div>
                        {card.total !== undefined && (
                            <div className="text-xs opacity-60 mt-0.5">sur {card.total} total</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent transactions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900">Transactions récentes</h2>
                        <Link to="/admin/transactions" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {recent_transactions.map((tx) => (
                            <div key={tx.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-gray-900 text-sm truncate">{tx.user}</div>
                                    <div className="text-xs text-gray-400 truncate">{tx.document}</div>
                                    <div className="font-mono text-xs text-gray-300">{tx.reference}</div>
                                </div>
                                <div className="text-right ml-4 flex-shrink-0">
                                    {statusBadge(tx.status)}
                                    <div className="text-sm font-bold text-gray-800 mt-1">
                                        {Number(tx.amount).toLocaleString('fr-FR')} FCFA
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top documents */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900">Documents populaires</h2>
                        <Link to="/admin/documents" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {top_documents.map((doc, i) => (
                            <div key={doc.id} className="px-6 py-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 text-sm truncate">{doc.title}</div>
                                    <div className="text-xs text-gray-400">{doc.downloads} téléchargements · {Number(doc.price).toLocaleString('fr-FR')} FCFA</div>
                                </div>
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${doc.is_active ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
