import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQ_DATA = [
    {
        category: '💳 Paiement',
        items: [
            {
                q: 'Quels moyens de paiement sont acceptés ?',
                a: 'Nous acceptons FedaPay (Mobile Money : MTN, Moov, Celtiis) et KKiaPay (carte bancaire Visa/MasterCard et Mobile Money). Les deux méthodes sont 100% sécurisées.',
            },
            {
                q: 'Mon paiement a été débité mais je n\'ai pas reçu le document. Que faire ?',
                a: 'Rendez-vous dans "Mes transactions" ou "Mes documents" pour retrouver votre lien de téléchargement. Si le problème persiste, contactez-nous avec votre référence de paiement.',
            },
            {
                q: 'Le paiement est-il sécurisé ?',
                a: 'Oui. Nous n\'accédons jamais à vos données bancaires. Les paiements sont traités directement par FedaPay et KKiaPay, des plateformes certifiées en Afrique de l\'Ouest.',
            },
            {
                q: 'Puis-je obtenir un remboursement ?',
                a: 'En raison de la nature numérique des documents, les remboursements ne sont généralement pas possibles. Contactez-nous avant l\'achat si vous avez des questions sur un document.',
            },
        ],
    },
    {
        category: '📥 Téléchargement',
        items: [
            {
                q: 'Combien de temps ai-je pour télécharger mon document ?',
                a: 'Le lien de téléchargement est valide 72 heures après votre paiement. Passé ce délai, contactez-nous pour obtenir un nouveau lien.',
            },
            {
                q: 'Puis-je télécharger le document plusieurs fois ?',
                a: 'Oui, vous pouvez télécharger le document autant de fois que nécessaire pendant la durée de validité du lien (72h). Après expiration, contactez le support.',
            },
            {
                q: 'Dans quel format sont les documents ?',
                a: 'Tous les documents sont au format PDF pour garantir leur compatibilité avec tous les appareils (PC, smartphone, tablette).',
            },
            {
                q: 'Je ne trouve plus mon lien de téléchargement. Comment le retrouver ?',
                a: 'Connectez-vous et allez dans "Mes Documents". Vous y retrouverez tous vos documents achetés avec les liens de téléchargement disponibles.',
            },
        ],
    },
    {
        category: '👤 Compte',
        items: [
            {
                q: 'Dois-je créer un compte pour acheter un document ?',
                a: 'Oui, un compte est nécessaire pour effectuer un achat. Cela vous permet de retrouver vos documents à tout moment dans votre espace personnel.',
            },
            {
                q: 'Comment créer un compte ?',
                a: 'Cliquez sur "S\'inscrire" en haut de la page, renseignez vos informations (nom, email, mot de passe) et c\'est tout. L\'inscription est gratuite.',
            },
            {
                q: 'J\'ai oublié mon mot de passe, que faire ?',
                a: 'Contactez-nous par email à milalogistique@gmail.com avec votre adresse email. Nous vous aiderons à réinitialiser votre mot de passe.',
            },
        ],
    },
    {
        category: '📄 Documents',
        items: [
            {
                q: 'Les documents sont-ils à jour ?',
                a: 'Oui. Nos documents sont régulièrement mis à jour pour refléter les dernières réglementations en matière de logistique, transport et douane au Bénin et en CEDEAO.',
            },
            {
                q: 'Puis-je prévisualiser un document avant l\'achat ?',
                a: 'La prévisualisation n\'est pas disponible pour protéger nos contenus. Consultez la description détaillée et les tags pour vous assurer que le document répond à vos besoins.',
            },
            {
                q: 'Un document que je cherche n\'est pas disponible. Que faire ?',
                a: 'Contactez-nous via le formulaire de contact en précisant le type de document dont vous avez besoin. Nous ferons notre possible pour l\'ajouter rapidement.',
            },
        ],
    },
];

function AccordionItem({ q, a }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-blue-200 shadow-sm' : 'border-gray-100'}`}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full text-left flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
                <span className="font-semibold text-gray-900 pr-4">{q}</span>
                <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-all ${open ? 'bg-blue-600 text-white rotate-180' : 'bg-gray-100 text-gray-500'}`}>
                    ▼
                </span>
            </button>
            {open && (
                <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4 bg-blue-50/30">
                    {a}
                </div>
            )}
        </div>
    );
}

export default function FaqPage() {
    return (
        <div>
            {/* Hero */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-16 text-center">
                <h1 className="text-4xl font-extrabold mb-3">Foire Aux Questions</h1>
                <p className="text-blue-200 text-lg">Trouvez rapidement des réponses à vos questions</p>
            </div>

            <div className="container mx-auto px-4 py-16 max-w-3xl">
                <div className="space-y-10">
                    {FAQ_DATA.map((section, i) => (
                        <div key={i}>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{section.category}</h2>
                            <div className="space-y-3">
                                {section.items.map((item, j) => (
                                    <AccordionItem key={j} q={item.q} a={item.a} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Vous n'avez pas trouvé votre réponse ?</h3>
                    <p className="text-gray-600 mb-5">Notre équipe est disponible pour vous aider.</p>
                    <Link to="/contact"
                        className="inline-block bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md">
                        Contacter le support →
                    </Link>
                </div>
            </div>
        </div>
    );
}
