import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function HomePage() {
    const [documents, setDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get('/api/documents?per_page=6'),
            axios.get('/api/categories'),
        ]).then(([docsRes, catsRes]) => {
            setDocuments(docsRes.data.data);
            setCategories(catsRes.data);
        }).finally(() => setLoading(false));
    }, []);

    return (
        <div>
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
                </div>

                <div className="relative container mx-auto px-4 py-20 md:py-28">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 text-sm">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <span>Plateforme disponible 24h/24</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                                Documents<br />
                                <span className="text-yellow-400">Logistiques</span><br />
                                Professionnels
                            </h1>
                            <p className="text-xl text-blue-100 mb-8 max-w-lg">
                                Accédez instantanément à nos documents spécialisés en logistique, transport, douane et plus.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <Link
                                    to="/documents"
                                    className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                >
                                    Parcourir les documents →
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl border border-white/30 transition-all"
                                >
                                    Créer un compte
                                </Link>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-8 mt-12 justify-center md:justify-start">
                                <div>
                                    <div className="text-3xl font-bold text-yellow-400">100+</div>
                                    <div className="text-blue-200 text-sm">Documents</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-yellow-400">500+</div>
                                    <div className="text-blue-200 text-sm">Clients</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-yellow-400">99%</div>
                                    <div className="text-blue-200 text-sm">Satisfaction</div>
                                </div>
                            </div>
                        </div>

                        {/* Logo card */}
                        <div className="flex-shrink-0">
                            <div className="relative">
                                <div className="absolute inset-0 bg-yellow-400/30 rounded-3xl blur-2xl transform rotate-6"></div>
                                <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
                                    <img
                                        src="/images/logomilla.jpeg"
                                        alt="Mila Logistique"
                                        className="w-48 h-48 rounded-2xl object-cover shadow-xl"
                                    />
                                    <div className="text-center mt-4">
                                        <div className="text-lg font-bold">Mila Logistique</div>
                                        <div className="text-blue-200 text-sm">Bénin 🇧🇯</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">Pourquoi choisir Mila Logistique ?</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: '⚡', title: 'Accès instantané', desc: 'Téléchargez vos documents immédiatement après paiement, 24h/24 7j/7.' },
                            { icon: '🔒', title: 'Paiement sécurisé', desc: 'Mobile Money via FedaPay ou carte bancaire via KKiaPay, 100% sécurisé.' },
                            { icon: '📋', title: 'Documents certifiés', desc: 'Tous nos documents sont validés par des experts en logistique.' },
                        ].map((f, i) => (
                            <div key={i} className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-blue-50 hover:shadow-md transition-all group">
                                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform inline-block">{f.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
                <section className="py-16 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-gray-900">Catégories disponibles</h2>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    to={`/documents?category=${encodeURIComponent(cat.name)}`}
                                    className="flex items-center space-x-2 bg-white px-5 py-3 rounded-full shadow-sm hover:shadow-md border border-gray-100 hover:border-blue-200 transition-all group"
                                >
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                    <span className="font-medium text-gray-700 group-hover:text-blue-600">{cat.name}</span>
                                    {cat.documents_count > 0 && (
                                        <span className="text-xs text-gray-400">({cat.documents_count})</span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Recent documents */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-bold text-gray-900">Documents récents</h2>
                        <Link to="/documents" className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1">
                            <span>Voir tous</span>
                            <span>→</span>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-gray-100 rounded-2xl h-52 animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {documents.map((doc) => (
                                <DocumentCard key={doc.id} document={doc} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Payment methods */}
            <section className="py-16 bg-blue-900 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">Moyens de paiement acceptés</h2>
                    <p className="text-blue-200 mb-10">Payez facilement avec votre méthode préférée</p>
                    <div className="flex flex-wrap gap-6 justify-center">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 flex items-center space-x-4 border border-white/20">
                            <span className="text-4xl">📱</span>
                            <div className="text-left">
                                <div className="font-bold text-lg">FedaPay</div>
                                <div className="text-blue-200 text-sm">Mobile Money (MTN, Moov, Celtiis)</div>
                            </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 flex items-center space-x-4 border border-white/20">
                            <span className="text-4xl">💳</span>
                            <div className="text-left">
                                <div className="font-bold text-lg">KKiaPay</div>
                                <div className="text-blue-200 text-sm">Visa, MasterCard & Mobile Money</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function DocumentCard({ document }) {
    return (
        <Link
            to={`/documents/${document.id}`}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 hover:border-blue-200 transition-all overflow-hidden"
        >
            <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">📄</span>
                    {document.is_purchased && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">✓ Acheté</span>
                    )}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {document.title}
                </h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{document.description}</p>
                <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-700">
                        {document.price.toLocaleString('fr-FR')} <span className="text-base">FCFA</span>
                    </span>
                    {document.category && (
                        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">{document.category}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
