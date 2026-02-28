import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        // Simulate send (connect to your email endpoint)
        setTimeout(() => {
            toast.success('Votre message a été envoyé. Nous vous répondrons dans les plus brefs délais.');
            setForm({ name: '', email: '', subject: '', message: '' });
            setSending(false);
        }, 1200);
    };

    return (
        <div>
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16 text-center">
                <h1 className="text-4xl font-extrabold mb-3">Contactez-nous</h1>
                <p className="text-blue-200 text-lg max-w-xl mx-auto">
                    Une question ? Besoin d'aide ? Notre équipe est disponible pour vous.
                </p>
            </div>

            <div className="container mx-auto px-4 py-16 max-w-5xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Contact info */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Nos coordonnées</h2>
                        <div className="space-y-5">
                            {[
                                { icon: '📍', label: 'Adresse', value: 'Cotonou, Bénin' },
                                { icon: '📞', label: 'Téléphone', value: '+229 01 52 75 56 08' },
                                { icon: '✉️', label: 'Email', value: 'milalogistique@gmail.com' },
                                { icon: '🕐', label: 'Horaires', value: 'Lun - Ven : 8h - 18h' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start space-x-4 bg-gray-50 rounded-xl p-4">
                                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                                    <div>
                                        <div className="font-semibold text-gray-700 text-sm">{item.label}</div>
                                        <div className="text-gray-900 mt-0.5">{item.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
                            <h3 className="font-bold text-blue-900 mb-2">💡 Support rapide</h3>
                            <p className="text-blue-700 text-sm leading-relaxed">
                                Pour les problèmes de téléchargement ou de paiement, mentionnez votre référence de transaction pour un traitement prioritaire.
                            </p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Envoyer un message</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom *</label>
                                    <input type="text" required value={form.name}
                                        onChange={e => setForm({...form, name: e.target.value})}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                                    <input type="email" required value={form.email}
                                        onChange={e => setForm({...form, email: e.target.value})}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sujet *</label>
                                <select required value={form.subject}
                                    onChange={e => setForm({...form, subject: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                                    <option value="">Choisir un sujet</option>
                                    <option value="payment">Problème de paiement</option>
                                    <option value="download">Problème de téléchargement</option>
                                    <option value="document">Question sur un document</option>
                                    <option value="account">Compte utilisateur</option>
                                    <option value="other">Autre</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message *</label>
                                <textarea required rows={5} value={form.message}
                                    onChange={e => setForm({...form, message: e.target.value})}
                                    placeholder="Décrivez votre problème ou question en détail..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" />
                            </div>

                            <button type="submit" disabled={sending}
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl font-bold transition-all shadow-md disabled:opacity-60">
                                {sending ? (
                                    <span className="flex items-center justify-center space-x-2">
                                        <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                                        <span>Envoi en cours...</span>
                                    </span>
                                ) : '✉️ Envoyer le message'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
