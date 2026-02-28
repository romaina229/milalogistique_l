import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function DownloadSuccessPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const ref = searchParams.get('ref');
    const [info, setInfo] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (token) {
            axios.get(`/api/downloads/info/${token}`)
                .then(res => setInfo(res.data))
                .catch(() => {});
        }
    }, [token]);

    const handleDownload = () => {
        if (!token) return;
        setDownloading(true);
        // Trigger file download
        const link = document.createElement('a');
        link.href = `/download/${token}`;
        link.click();
        setTimeout(() => setDownloading(false), 2000);
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="max-w-lg w-full text-center">
                {/* Success animation */}
                <div className="relative mb-8">
                    <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                        <span className="text-5xl">🎉</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm">
                        ✨
                    </div>
                </div>

                <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Paiement réussi !</h1>
                <p className="text-lg text-gray-600 mb-8">
                    Votre document est prêt à être téléchargé.
                </p>

                {/* Document info */}
                {info?.document && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 text-left">
                        <div className="flex items-center space-x-3">
                            <span className="text-3xl">📄</span>
                            <div>
                                <div className="font-bold text-gray-900">{info.document.title}</div>
                                {info.expires_at && (
                                    <div className="text-sm text-gray-500 mt-1">
                                        ⏱️ Lien valide jusqu'au {new Date(info.expires_at).toLocaleDateString('fr-FR', {
                                            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {token ? (
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-5 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 disabled:opacity-70 mb-4"
                    >
                        {downloading ? (
                            <span className="flex items-center justify-center space-x-2">
                                <span className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></span>
                                <span>Téléchargement...</span>
                            </span>
                        ) : (
                            '📥 Télécharger maintenant'
                        )}
                    </button>
                ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-yellow-800 text-sm">
                        ⚠️ Lien de téléchargement non disponible. Consultez <Link to="/my-documents" className="underline font-semibold">Mes Documents</Link> ou vérifiez votre email.
                    </div>
                )}

                <div className="flex gap-4 justify-center mt-2">
                    <Link to="/my-documents" className="flex-1 text-center border border-blue-200 text-blue-600 hover:bg-blue-50 py-3 rounded-xl font-semibold transition-all text-sm">
                        📂 Mes Documents
                    </Link>
                    <Link to="/documents" className="flex-1 text-center border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold transition-all text-sm">
                        🔍 Autres documents
                    </Link>
                </div>

                {ref && (
                    <p className="text-xs text-gray-400 mt-6">Réf: {ref}</p>
                )}
            </div>
        </div>
    );
}
