import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function AdminDocuments() {
    const [documents, setDocuments] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState({
        title: '', description: '', price: '', category_id: '', tags: '',
        file_type: 'upload', file_url: '', file: null, is_active: true,
    });

    useEffect(() => {
        axios.get('/api/categories').then(res => setCategories(res.data));
        fetchDocuments();
    }, []);

    const fetchDocuments = async (page = 1, q = search) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/admin/documents?page=${page}&search=${q}`);
            setDocuments(data.data);
            setPagination(data);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setForm({ title: '', description: '', price: '', category_id: '', tags: '', file_type: 'upload', file_url: '', file: null, is_active: true });
        setShowModal(true);
    };

    const openEdit = (doc) => {
        setEditing(doc);
        setForm({
            title: doc.title,
            description: doc.description || '',
            price: doc.price,
            category_id: doc.category_id || '',
            tags: doc.tags || '',
            file_type: doc.file_type || 'upload',
            file_url: doc.file_type === 'drive' ? doc.file_path : '',
            file: null,
            is_active: doc.is_active,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (v !== null && v !== '') fd.append(k, v);
        });

        try {
            if (editing) {
                await axios.post(`/api/admin/documents/${editing.id}?_method=PUT`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Document mis à jour');
            } else {
                await axios.post('/api/admin/documents', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Document créé');
            }
            setShowModal(false);
            fetchDocuments();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur');
        }
    };

    const toggleStatus = async (doc) => {
        await axios.patch(`/api/admin/documents/${doc.id}/toggle`);
        fetchDocuments();
        toast.success(`Document ${doc.is_active ? 'désactivé' : 'activé'}`);
    };

    const deleteDoc = async (doc) => {
        if (!confirm(`Supprimer "${doc.title}" ?`)) return;
        await axios.delete(`/api/admin/documents/${doc.id}`);
        toast.success('Document supprimé');
        fetchDocuments();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center space-x-2">
                    <span>+</span>
                    <span>Nouveau document</span>
                </button>
            </div>

            {/* Search */}
            <div className="flex gap-3 mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchDocuments(1, search)}
                    placeholder="Rechercher..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button onClick={() => fetchDocuments(1, search)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                    Chercher
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Document</th>
                                <th className="text-left px-4 py-4 font-semibold text-gray-600">Catégorie</th>
                                <th className="text-right px-4 py-4 font-semibold text-gray-600">Prix</th>
                                <th className="text-center px-4 py-4 font-semibold text-gray-600">Téléch.</th>
                                <th className="text-center px-4 py-4 font-semibold text-gray-600">Statut</th>
                                <th className="text-center px-4 py-4 font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-12 text-gray-400">Chargement...</td></tr>
                            ) : documents.map(doc => (
                                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 max-w-xs truncate">{doc.title}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{doc.file_type === 'drive' ? '🔗 Drive' : '📁 Upload'} · {doc.file_size}</div>
                                    </td>
                                    <td className="px-4 py-4 text-gray-600">{doc.category?.name || doc.category || '—'}</td>
                                    <td className="px-4 py-4 text-right font-bold text-blue-700">
                                        {Number(doc.price).toLocaleString('fr-FR')} FCFA
                                    </td>
                                    <td className="px-4 py-4 text-center text-gray-500">{doc.downloads}</td>
                                    <td className="px-4 py-4 text-center">
                                        <button onClick={() => toggleStatus(doc)}>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${doc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {doc.is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </button>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => openEdit(doc)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Modifier">
                                                ✏️
                                            </button>
                                            <button onClick={() => deleteDoc(doc)} className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Supprimer">
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
                        {[...Array(pagination.last_page)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => fetchDocuments(i + 1)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium ${pagination.current_page === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editing ? 'Modifier le document' : 'Nouveau document'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <Field label="Titre *">
                                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                                    className="form-input w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </Field>

                            <Field label="Description">
                                <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Prix (FCFA) *">
                                    <input type="number" required min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </Field>
                                <Field label="Catégorie">
                                    <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                        <option value="">Choisir...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </Field>
                            </div>

                            <Field label="Tags (séparés par virgule)">
                                <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
                                    placeholder="logistique, transport, douane"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                            </Field>

                            <Field label="Type de fichier">
                                <div className="flex gap-3">
                                    {['upload', 'drive'].map(t => (
                                        <button key={t} type="button" onClick={() => setForm({...form, file_type: t})}
                                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${form.file_type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                            {t === 'upload' ? '📁 Upload' : '🔗 Google Drive'}
                                        </button>
                                    ))}
                                </div>
                            </Field>

                            {form.file_type === 'drive' ? (
                                <Field label="Lien Google Drive *">
                                    <input type="url" value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})}
                                        placeholder="https://drive.google.com/..."
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                                </Field>
                            ) : (
                                <Field label={editing ? 'Nouveau fichier PDF (optionnel)' : 'Fichier PDF *'}>
                                    <input type="file" accept=".pdf"
                                        onChange={e => setForm({...form, file: e.target.files[0]})}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:font-medium" />
                                </Field>
                            )}

                            <div className="flex items-center space-x-3">
                                <input type="checkbox" id="is_active" checked={form.is_active}
                                    onChange={e => setForm({...form, is_active: e.target.checked})}
                                    className="w-4 h-4 rounded" />
                                <label htmlFor="is_active" className="text-sm text-gray-700 font-medium">Document actif (visible en ligne)</label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold text-sm transition-all">
                                    Annuler
                                </button>
                                <button type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-all">
                                    {editing ? 'Mettre à jour' : 'Créer le document'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
            {children}
        </div>
    );
}
