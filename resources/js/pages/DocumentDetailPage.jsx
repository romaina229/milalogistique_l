// DocumentDetailPage
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export function DocumentDetailPage() {
    const { id } = useParams();
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const isAuth = useAuthStore(s => s.isAuthenticated());

    useEffect(() => {
        axios.get(`/api/documents/${id}`)
            .then(res => setDoc(res.data))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="flex justify-center items-center py-32"><div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
    if (!doc) return <div className="text-center py-20 text-gray-500">Document non trouvé</div>;

    return (
        <div className="container mx-auto px-4 py-10 max-w-4xl">
            <Link to="/documents" className="text-blue-600 text-sm hover:underline mb-6 inline-flex items-center space-x-1">
                <span>←</span><span>Retour aux documents</span>
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-4">
                <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {doc.category && <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">{doc.category}</span>}
                            {doc.is_purchased && <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">✓ Acheté</span>}
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{doc.title}</h1>
                        {doc.description && <p className="text-gray-600 leading-relaxed">{doc.description}</p>}

                        <div className="flex gap-6 mt-6 text-sm text-gray-500">
                            <span>👁️ {doc.views} vues</span>
                            <span>📥 {doc.downloads} téléchargements</span>
                            {doc.file_size && <span>📦 {doc.file_size}</span>}
                        </div>

                        {doc.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {doc.tags.map(t => <span key={t} className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{t}</span>)}
                            </div>
                        )}
                    </div>

                    <div className="w-full md:w-72 bg-blue-50 rounded-2xl p-6 border border-blue-100">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-2">📄</div>
                            <div className="text-4xl font-extrabold text-blue-700">{doc.price.toLocaleString('fr-FR')}</div>
                            <div className="text-blue-600 font-medium">FCFA</div>
                        </div>

                        {doc.is_purchased ? (
                            <Link to="/my-documents" className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-all">
                                📥 Télécharger
                            </Link>
                        ) : isAuth ? (
                            <Link to={`/payment/${doc.id}`} className="block w-full text-center bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all shadow-md">
                                🔒 Acheter maintenant
                            </Link>
                        ) : (
                            <Link to={`/login?redirect=/payment/${doc.id}`} className="block w-full text-center bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all">
                                Se connecter pour acheter
                            </Link>
                        )}

                        <div className="text-center mt-4 text-xs text-gray-500 space-y-1">
                            <div>🔒 Paiement sécurisé</div>
                            <div>⚡ Téléchargement immédiat</div>
                            <div>📱 FedaPay · 💳 KKiaPay</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DocumentDetailPage;

// Remaining stubs...
