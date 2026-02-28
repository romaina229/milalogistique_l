import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const STATUS_LABELS = {
    paid:      { label: '✓ Payé',       cls: 'bg-green-100 text-green-700' },
    pending:   { label: '⏳ En attente', cls: 'bg-yellow-100 text-yellow-700' },
    failed:    { label: '✗ Échoué',     cls: 'bg-red-100 text-red-700' },
    cancelled: { label: '🚫 Annulé',    cls: 'bg-gray-100 text-gray-600' },
};

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch from my-documents which includes transaction info, or create a dedicated endpoint
        axios.get('/api/my-documents')
            .then(res => setTransactions(res.data.data || []))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center py-32">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-10 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes transactions</h1>
            <p className="text-gray-500 mb-8">{transactions.length} transaction(s)</p>

            {transactions.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <span className="text-6xl">💳</span>
                    <h2 className="text-xl font-bold text-gray-700 mt-4">Aucune transaction</h2>
                    <p className="text-gray-500 mt-2 mb-6">Vous n'avez pas encore effectué d'achats.</p>
                    <Link to="/documents" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all">
                        Parcourir les documents
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {transactions.map(item => {
                        const s = STATUS_LABELS['paid'];
                        return (
                            <div key={item.transaction_id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📄</div>
                                    <div>
                                        <div className="font-bold text-gray-900 mb-0.5">{item.document?.title}</div>
                                        <div className="font-mono text-xs text-gray-400">{item.reference}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {item.payment_method === 'fedapay' ? '📱 FedaPay' : '💳 KKiaPay'} •{' '}
                                            {new Date(item.purchased_at).toLocaleDateString('fr-FR', {
                                                day: '2-digit', month: 'long', year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-lg font-extrabold text-blue-700">
                                            {Number(item.amount).toLocaleString('fr-FR')} <span className="text-sm font-medium text-gray-500">FCFA</span>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                                    </div>

                                    {item.download?.is_valid && (
                                        <a href={`/download/${item.download.token}`}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap">
                                            📥 Télécharger
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
