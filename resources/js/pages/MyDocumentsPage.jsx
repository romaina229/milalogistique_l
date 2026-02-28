import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function MyDocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/my-documents')
            .then(res => setDocuments(res.data.data))
            .finally(() => setLoading(false));
    }, []);

    const handleDownload = (token, title) => {
        const link = document.createElement('a');
        link.href = `/download/${token}`;
        link.click();
        toast.success(`Téléchargement de "${title}" démarré`);
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Mes documents achetés</h1>
                <p className="text-gray-500 mt-1">{documents.length} document(s)</p>
            </div>

            {documents.length === 0 ? (
                <div className="text-center py-20">
                    <span className="text-7xl">📭</span>
                    <h2 className="text-2xl font-bold text-gray-700 mt-4">Aucun document acheté</h2>
                    <p className="text-gray-500 mt-2">Parcourez notre catalogue pour trouver vos documents</p>
                    <a href="/documents" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all">
                        Parcourir les documents
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((item) => (
                        <div key={item.transaction_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-4xl">📄</span>
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">✓ Payé</span>
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{item.document?.title}</h3>
                                <div className="text-sm text-gray-500 space-y-1 mt-3">
                                    <div className="flex justify-between">
                                        <span>Montant</span>
                                        <span className="font-semibold text-blue-700">{Number(item.amount).toLocaleString('fr-FR')} FCFA</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Méthode</span>
                                        <span>{item.payment_method === 'fedapay' ? '📱 FedaPay' : '💳 KKiaPay'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Date</span>
                                        <span>{new Date(item.purchased_at).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                    {item.download?.expires_at && (
                                        <div className="flex justify-between">
                                            <span>Expire le</span>
                                            <span className={`text-xs ${item.download.is_valid ? 'text-green-600' : 'text-red-500'}`}>
                                                {new Date(item.download.expires_at).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="px-6 pb-5">
                                {item.download?.is_valid ? (
                                    <button
                                        onClick={() => handleDownload(item.download.token, item.document?.title)}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm transition-all"
                                    >
                                        📥 Télécharger
                                    </button>
                                ) : (
                                    <div className="w-full text-center bg-gray-100 text-gray-400 py-3 rounded-xl font-semibold text-sm">
                                        Lien expiré — Contactez le support
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
