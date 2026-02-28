import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function PaymentPage() {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('');
    const [phone, setPhone] = useState('');
    const [transaction, setTransaction] = useState(null);
    const fedapayRef = useRef(null);

    useEffect(() => {
        axios.get(`/api/documents/${documentId}`)
            .then(res => {
                if (res.data.is_purchased) {
                    toast.success('Document déjà acheté !');
                    navigate(`/my-documents`);
                    return;
                }
                setDocument(res.data);
            })
            .catch(() => navigate('/documents'))
            .finally(() => setLoading(false));
    }, [documentId]);

    const initiatePayment = async () => {
        if (!selectedMethod) {
            toast.error('Veuillez choisir une méthode de paiement');
            return;
        }
        if (selectedMethod === 'fedapay' && !phone) {
            toast.error('Veuillez entrer votre numéro de téléphone');
            return;
        }

        setPaymentLoading(true);
        try {
            const { data } = await axios.post('/api/payments/initiate', {
                document_id: parseInt(documentId),
                payment_method: selectedMethod,
                phone: phone || undefined,
            });

            if (data.already_purchased) {
                toast.success('Document déjà acheté !');
                navigate(`/download-success?token=${data.download_token}`);
                return;
            }

            setTransaction(data);

            if (selectedMethod === 'kkiapay') {
                openKKiaPay(data);
            } else if (selectedMethod === 'fedapay') {
                openFedaPay(data);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors de l\'initiation du paiement');
        } finally {
            setPaymentLoading(false);
        }
    };

    /**
     * KKiaPay widget integration
     * Using the official window.openKkiapayWidget function from cdn.kkiapay.me/k.js
     */
    const openKKiaPay = (txData) => {
        if (typeof window.openKkiapayWidget !== 'function') {
            toast.error('Le widget KKiaPay n\'est pas chargé. Veuillez actualiser la page.');
            return;
        }

        const config = window.APP_CONFIG;

        window.openKkiapayWidget({
            amount: txData.amount,
            api_key: config.kkiapayPublicKey,
            sandbox: config.fedapayEnv !== 'live',
            email: undefined,
            phone: '',
            data: JSON.stringify({ reference: txData.reference }),
            callback: `${config.appUrl}/api/payments/callback/kkiapay`,
        });

        // Listen for KKiaPay events
        const handleSuccess = async (response) => {
            toast.loading('Confirmation du paiement...', { id: 'pay-confirm' });
            try {
                const { data } = await axios.post('/api/payments/kkiapay/success', {
                    transactionId: response.transactionId,
                    reference: txData.reference,
                });

                toast.dismiss('pay-confirm');

                if (data.success && data.status === 'paid') {
                    toast.success('Paiement réussi ! 🎉');
                    navigate(`/download-success?token=${data.download_token}&ref=${txData.reference}`);
                } else {
                    navigate(`/payment/status/${txData.reference}`);
                }
            } catch {
                toast.dismiss('pay-confirm');
                navigate(`/payment/status/${txData.reference}`);
            }
        };

        const handleFailed = () => {
            toast.error('Paiement échoué ou annulé.');
            navigate(`/payment/status/${txData.reference}`);
        };

        // Remove old listeners to avoid duplicates
        if (typeof window.addSuccessListener === 'function') {
            window.addSuccessListener(handleSuccess);
        }
        if (typeof window.addFailedListener === 'function') {
            window.addFailedListener(handleFailed);
        }

        // Alternative: direct event listeners
        window.addEventListener('kpayment-success', (e) => handleSuccess(e.detail));
        window.addEventListener('kpayment-failed', handleFailed);
    };

    /**
     * FedaPay widget integration
     * Using the official FedaPay checkout.js widget
     * data-return-url will redirect the user after payment
     */
    const openFedaPay = (txData) => {
        if (typeof window.FedaPay === 'undefined' && typeof window.FedaPayCheckout === 'undefined') {
            toast.error('Le widget FedaPay n\'est pas chargé. Veuillez actualiser la page.');
            return;
        }

        const config = window.APP_CONFIG;
        const returnUrl = `${config.appUrl}/payment/status/${txData.reference}`;
        const callbackUrl = `${config.appUrl}/api/payments/callback/fedapay`;

        try {
            // Method 1: FedaPayCheckout
            if (typeof window.FedaPayCheckout !== 'undefined') {
                const checkout = window.FedaPayCheckout.init({
                    public_key: config.fedapayPublicKey,
                    transaction: {
                        amount: txData.amount,
                        description: txData.document?.title || 'Document',
                        reference: txData.reference,
                    },
                    customer: {
                        phone_number: {
                            number: phone,
                            country: 'BJ',
                        },
                    },
                    currency: { iso: 'XOF' },
                    onComplete: (response) => {
                        handleFedaPayResponse(response, txData.reference);
                    },
                });
                checkout.open();
                return;
            }

            // Method 2: Direct widget via DOM (checkout.js injects a button/widget)
            // Create temporary form
            const formContainer = globalThis.document.getElementById('fedapay-widget-container');
            if (formContainer) {
                formContainer.innerHTML = '';
                const script = globalThis.document.createElement('script');
                script.setAttribute('src', 'https://cdn.fedapay.com/checkout.js?v=1.1.7');
                script.setAttribute('data-public-key', config.fedapayPublicKey);
                script.setAttribute('data-button-text', `Payer ${txData.amount.toLocaleString('fr-FR')} FCFA`);
                script.setAttribute('data-button-class', 'fedapay-btn');
                script.setAttribute('data-transaction-amount', String(txData.amount));
                script.setAttribute('data-transaction-description', txData.document?.title || 'Document');
                script.setAttribute('data-currency-iso', 'XOF');
                script.setAttribute('data-customer-phone', phone);
                script.setAttribute('data-callback', callbackUrl);
                script.setAttribute('data-return-url', returnUrl);
                formContainer.appendChild(script);

                // Click the injected button automatically after load
                setTimeout(() => {
                    const btn = formContainer.querySelector('.fedapay-checkout, .fedapay-btn, button');
                    if (btn) btn.click();
                }, 1500);
            }
        } catch (err) {
            console.error('FedaPay error:', err);
            toast.error('Erreur lors de l\'ouverture du formulaire FedaPay. Actualisez la page.');
        }
    };

    const handleFedaPayResponse = async (response, reference) => {
        const status = response?.reason || response?.transaction?.status || '';
        if (['approved', 'transferred', 'completed', 'success'].includes(status?.toLowerCase())) {
            // Poll for payment confirmation
            navigate(`/payment/status/${reference}?autocheck=1`);
        } else {
            navigate(`/payment/status/${reference}`);
        }
    };

    const pollPaymentStatus = async (reference) => {
        toast.loading('Vérification du paiement...', { id: 'poll' });
        try {
            const { data } = await axios.get(`/api/payments/status/${reference}`);
            toast.dismiss('poll');
            if (data.status === 'paid' && data.download_token) {
                toast.success('Paiement confirmé !');
                navigate(`/download-success?token=${data.download_token}&ref=${reference}`);
            } else {
                navigate(`/payment/status/${reference}`);
            }
        } catch {
            toast.dismiss('poll');
            navigate(`/payment/status/${reference}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!document) return null;

    return (
        <div className="container mx-auto px-4 py-10 max-w-3xl">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Finaliser votre achat</h1>
                <p className="text-gray-500 mt-2">Choisissez votre méthode de paiement</p>
            </div>

            {/* Order summary */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 mb-8 border border-blue-200">
                <h2 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <span>📋</span>
                    <span>Récapitulatif</span>
                </h2>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{document.title}</h3>
                        {document.category && (
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                                {document.category}
                            </span>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-extrabold text-blue-700">
                            {document.price.toLocaleString('fr-FR')}
                        </div>
                        <div className="text-sm text-blue-600 font-medium">FCFA</div>
                    </div>
                </div>
            </div>

            {/* Payment methods */}
            <div className="space-y-4 mb-6">
                <h2 className="font-bold text-gray-800 text-lg">Mode de paiement</h2>

                {/* KKiaPay */}
                <PaymentMethodCard
                    id="kkiapay"
                    selected={selectedMethod === 'kkiapay'}
                    onSelect={() => setSelectedMethod('kkiapay')}
                    icon="💳"
                    title="KKiaPay"
                    subtitle="Carte bancaire Visa/MasterCard & Mobile Money"
                    badge="Recommandé"
                    badgeColor="green"
                />

                {/* FedaPay */}
                <PaymentMethodCard
                    id="fedapay"
                    selected={selectedMethod === 'fedapay'}
                    onSelect={() => setSelectedMethod('fedapay')}
                    icon="📱"
                    title="FedaPay"
                    subtitle="Mobile Money (MTN, Moov, Celtiis Bénin)"
                />

                {/* Phone field for FedaPay */}
                {selectedMethod === 'fedapay' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            📞 Numéro de téléphone Mobile Money *
                        </label>
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                            <span className="px-3 py-3 bg-gray-50 text-gray-600 text-sm border-r border-gray-300">+229</span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="01 23 45 67 89"
                                className="flex-1 px-3 py-3 text-sm outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Vous recevrez une demande de paiement sur ce numéro.</p>
                    </div>
                )}
            </div>

            {/* FedaPay widget container */}
            <div id="fedapay-widget-container" className="hidden"></div>

            {/* Pay button */}
            <button
                onClick={initiatePayment}
                disabled={paymentLoading || !selectedMethod}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                    selectedMethod && !paymentLoading
                        ? 'bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white hover:shadow-xl hover:-translate-y-0.5'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
            >
                {paymentLoading ? (
                    <span className="flex items-center justify-center space-x-2">
                        <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                        <span>Initialisation...</span>
                    </span>
                ) : (
                    `🔒 Payer ${document.price.toLocaleString('fr-FR')} FCFA`
                )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
                🛡️ Paiement 100% sécurisé · Téléchargement immédiat après confirmation
            </p>

            {/* Back */}
            <div className="text-center mt-4">
                <Link to={`/documents/${documentId}`} className="text-sm text-gray-500 hover:text-gray-700">
                    ← Retour au document
                </Link>
            </div>
        </div>
    );
}

function PaymentMethodCard({ id, selected, onSelect, icon, title, subtitle, badge, badgeColor = 'blue' }) {
    return (
        <button
            onClick={onSelect}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                selected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
        >
            <div className="flex items-center space-x-4">
                <span className="text-3xl">{icon}</span>
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900">{title}</span>
                        {badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                badgeColor === 'green' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {badge}
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selected ? 'border-blue-500' : 'border-gray-300'
                }`}>
                    {selected && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                </div>
            </div>
        </button>
    );
}
