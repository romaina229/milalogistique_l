import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const STATUS_CONFIG = {
    pending:   { color: 'yellow', icon: '⏳', label: 'En attente', desc: 'Votre paiement est en cours de traitement...' },
    paid:      { color: 'green',  icon: '✅', label: 'Paiement réussi', desc: 'Votre paiement a été confirmé !' },
    failed:    { color: 'red',    icon: '❌', label: 'Paiement échoué', desc: 'Votre paiement n\'a pas pu être traité.' },
    cancelled: { color: 'gray',   icon: '🚫', label: 'Annulé', desc: 'Le paiement a été annulé.' },
};

export default function PaymentStatusPage() {
    const { reference } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [polling, setPolling] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const pollInterval = useRef(null);
    const countdownInterval = useRef(null);

    const fetchStatus = async () => {
        try {
            const { data } = await axios.get(`/api/payments/status/${reference}`);
            setStatus(data);

            // If paid, redirect to download success
            if (data.status === 'paid' && data.download_token) {
                clearIntervals();
                navigate(`/download-success?token=${data.download_token}&ref=${reference}`);
            }

            // Stop polling if final state
            if (['paid', 'failed', 'cancelled'].includes(data.status)) {
                clearIntervals();
                setPolling(false);
            }
        } catch (err) {
            console.error('Status check error:', err);
        } finally {
            setLoading(false);
        }
    };

    const clearIntervals = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
        if (countdownInterval.current) clearInterval(countdownInterval.current);
    };

    useEffect(() => {
        fetchStatus();

        // Auto-poll if status is pending
        const autoCheck = searchParams.get('autocheck') === '1';
        if (autoCheck) {
            setPolling(true);
            startPolling();
        }

        return () => clearIntervals();
    }, [reference]);

    const startPolling = () => {
        clearIntervals();
        setCountdown(5);
        setPolling(true);

        countdownInterval.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        pollInterval.current = setInterval(async () => {
            await fetchStatus();
        }, 5000);

        // Stop after 2 minutes
        setTimeout(() => {
            clearIntervals();
            setPolling(false);
        }, 120000);
    };

    const config = STATUS_CONFIG[status?.status] || STATUS_CONFIG.pending;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
            {/* Status icon */}
            <div className="text-7xl mb-6 animate-bounce">{config.icon}</div>

            <h1 className={`text-3xl font-bold mb-3 ${
                config.color === 'green' ? 'text-green-700' :
                config.color === 'red' ? 'text-red-600' :
                config.color === 'yellow' ? 'text-yellow-600' : 'text-gray-600'
            }`}>
                {config.label}
            </h1>
            <p className="text-gray-600 mb-8">{config.desc}</p>

            {/* Transaction info */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Référence</span>
                    <span className="font-mono font-medium text-gray-800">{reference}</span>
                </div>
                {status?.amount && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Montant</span>
                        <span className="font-bold text-blue-700">{Number(status.amount).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                )}
                {status?.method && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Méthode</span>
                        <span className="font-medium text-gray-700">
                            {status.method === 'fedapay' ? '📱 FedaPay' : '💳 KKiaPay'}
                        </span>
                    </div>
                )}
                {status?.document && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Document</span>
                        <span className="font-medium text-gray-700 text-right max-w-[60%]">{status.document.title}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            {status?.status === 'pending' && (
                <div>
                    {polling ? (
                        <div className="flex items-center justify-center space-x-3 text-blue-600 mb-6">
                            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            <span className="text-sm">Vérification automatique...</span>
                        </div>
                    ) : (
                        <button
                            onClick={() => { fetchStatus(); startPolling(); }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold mb-4 transition-all"
                        >
                            🔄 Vérifier le statut
                        </button>
                    )}
                    <p className="text-xs text-gray-400">
                        Si vous avez effectué le paiement, il peut prendre quelques minutes à être confirmé.
                    </p>
                </div>
            )}

            {status?.status === 'paid' && status?.download_token && (
                <a
                    href={`/download/${status.download_token}`}
                    className="block w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl mb-4"
                >
                    📥 Télécharger le document
                </a>
            )}

            {['failed', 'cancelled'].includes(status?.status) && (
                <Link
                    to={`/payment/${status?.document?.id}`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all mb-4"
                >
                    🔄 Réessayer le paiement
                </Link>
            )}

            <Link to="/documents" className="text-sm text-gray-500 hover:text-gray-700">
                ← Retour aux documents
            </Link>
        </div>
    );
}
