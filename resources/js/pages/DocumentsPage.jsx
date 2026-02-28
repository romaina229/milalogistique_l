import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export default function DocumentsPage() {
    const [documents, setDocuments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const isAuth = useAuthStore(s => s.isAuthenticated());

    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');

    const [searchInput, setSearchInput] = useState(search);

    useEffect(() => {
        axios.get('/api/categories').then(res => setCategories(res.data));
    }, []);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ page });
        if (search) params.append('search', search);
        if (category) params.append('category', category);

        axios.get(`/api/documents?${params}`)
            .then(res => {
                setDocuments(res.data.data);
                setPagination(res.data);
            })
            .finally(() => setLoading(false));
    }, [search, category, page]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchParams(prev => {
            const p = new URLSearchParams(prev);
            if (searchInput) p.set('search', searchInput);
            else p.delete('search');
            p.delete('page');
            return p;
        });
    };

    const selectCategory = (cat) => {
        setSearchParams(prev => {
            const p = new URLSearchParams(prev);
            if (cat === category) p.delete('category');
            else p.set('category', cat);
            p.delete('page');
            return p;
        });
    };

    return (
        <div className="container mx-auto px-4 py-10">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Bibliothèque de documents</h1>
                <p className="text-gray-500 text-lg">Documents professionnels de logistique, transport et douane</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Rechercher un document..."
                            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        />
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all">
                        Rechercher
                    </button>
                </div>
            </form>

            {/* Categories */}
            {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-8">
                    <button
                        onClick={() => selectCategory('')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            !category ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Toutes
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => selectCategory(cat.name)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-1 ${
                                category === cat.name ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                            <span>{cat.name}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Results */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse"></div>
                    ))}
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-20">
                    <span className="text-6xl">📭</span>
                    <h3 className="text-xl font-bold text-gray-700 mt-4">Aucun document trouvé</h3>
                    <p className="text-gray-500 mt-2">Essayez d'autres termes de recherche</p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-500 mb-4">{pagination?.total || 0} document(s) trouvé(s)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {documents.map(doc => (
                            <DocumentCard key={doc.id} document={doc} isAuth={isAuth} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="flex justify-center gap-2 mt-10">
                            {[...Array(pagination.last_page)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSearchParams(prev => {
                                        const p = new URLSearchParams(prev);
                                        p.set('page', i + 1);
                                        return p;
                                    })}
                                    className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${
                                        page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function DocumentCard({ document, isAuth }) {
    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 hover:border-blue-200 transition-all overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-3">
                    <span className="text-4xl">📄</span>
                    {document.is_purchased && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                            <span>✓</span>
                            <span>Acheté</span>
                        </span>
                    )}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                    {document.title}
                </h3>
                {document.description && (
                    <p className="text-gray-400 text-xs mb-4 line-clamp-2">{document.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mb-4">
                    {document.category && (
                        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{document.category}</span>
                    )}
                    {document.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                </div>
                <div className="text-2xl font-extrabold text-blue-700">
                    {document.price.toLocaleString('fr-FR')} <span className="text-sm font-medium text-gray-500">FCFA</span>
                </div>
            </div>
            <div className="px-6 pb-5">
                {document.is_purchased ? (
                    <Link
                        to={`/my-documents`}
                        className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-all"
                    >
                        📥 Télécharger
                    </Link>
                ) : isAuth ? (
                    <Link
                        to={`/payment/${document.id}`}
                        className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-all"
                    >
                        Acheter →
                    </Link>
                ) : (
                    <Link
                        to={`/login?redirect=/payment/${document.id}`}
                        className="block w-full text-center border border-blue-300 text-blue-600 hover:bg-blue-50 py-2.5 rounded-xl font-semibold text-sm transition-all"
                    >
                        Se connecter pour acheter
                    </Link>
                )}
            </div>
        </div>
    );
}
