# 🔧 Corrections des Paiements — Guide Complet

## Résumé des bugs identifiés dans le code PHP original

---

## 🔴 BUG #1 — FedaPay : Format du webhook mal parsé

### Problème dans `callback_fedapay.php`
Le code cherchait `$data['reference']` directement, mais **FedaPay envoie son webhook
dans une enveloppe événement** :

```json
// ❌ Ce que le code attendait (FAUX)
{
  "reference": "PAY_xxx",
  "status": "approved",
  "amount": 500
}

// ✅ Ce que FedaPay envoie réellement
{
  "id": 1,
  "name": "transaction.approved",
  "object": {
    "id": 123456,
    "reference": "PAY_xxx",
    "status": "approved",
    "amount": 500,
    "currency": { "iso": "XOF" },
    "customer": { "email": "...", "phone_number": { "number": "..." } }
  }
}
```

### Fix dans `PaymentService::handleFedaPayWebhook()`
```php
// Extraire l'objet depuis le webhook event
$eventName = $payload['name'] ?? '';
$txObject  = $payload['object'] ?? $payload; // fallback si format direct

$reference = $txObject['reference'] ?? null;
$status    = $txObject['status'] ?? null;
```

### Status FedaPay → Status interne
| FedaPay        | Laravel    |
|----------------|------------|
| approved       | paid       |
| transferred    | paid       |
| declined       | failed     |
| cancelled      | cancelled  |
| pending        | pending    |

---

## 🔴 BUG #2 — KKiaPay : CDN incorrect + JS invalide

### Problème dans `paiement_kiapay.php`

**1. Mauvais CDN :**
```html
<!-- ❌ FAUX (ne charge pas) -->
<script src="https://cdn.kiapay.io/kiapay-widget.js"></script>

<!-- ✅ CORRECT -->
<script src="https://cdn.kkiapay.me/k.js"></script>
```

**2. Syntaxe JavaScript invalide :**
```js
// ❌ Ce bloc était en dehors du script → erreur de parse
src="https://cdn.kkiapay.me/k.js"
```

**3. Mauvaise API KKiaPay :**
```js
// ❌ FAUX : KkiapayWidget n'existe pas
const kiapay = new KiapayWidget(kiapayConfig);

// ✅ CORRECT : utiliser openKkiapayWidget()
window.openKkiapayWidget({
    amount: 500,
    api_key: 'votre_cle_publique',
    sandbox: false,  // true pour les tests
    phone: '',
    data: JSON.stringify({ reference: 'PAY_xxx' }),
    callback: 'https://votre-site.bj/api/payments/callback/kkiapay',
});
```

### Fix dans `PaymentPage.jsx`
```js
window.openKkiapayWidget({
    amount: txData.amount,
    api_key: config.kkiapayPublicKey,
    sandbox: config.fedapayEnv !== 'live',
    data: JSON.stringify({ reference: txData.reference }),
    callback: `${config.appUrl}/api/payments/callback/kkiapay`,
});

// Écouter les événements de succès/échec
window.addSuccessListener((response) => {
    // response.transactionId → vérifier via API KKiaPay
});
window.addFailedListener(() => {
    // gérer l'échec
});
```

---

## 🔴 BUG #3 — KKiaPay : Webhook non vérifié

### Problème
Le callback KKiaPay se contenait de lire `$data['status']` sans **vérifier
auprès de l'API KKiaPay** si le paiement est réellement confirmé.

```php
// ❌ DANGEREUX : n'importe qui peut envoyer status=SUCCESS
if ($status === 'SUCCESS') {
    // ← Aucune vérification API
    $nouveau_statut = 'paye';
}
```

### Fix : Vérification obligatoire via l'API KKiaPay
```php
// ✅ CORRECT dans PaymentService::verifyKKiaPayTransaction()
$url = "https://api.kkiapay.me/api/v1/transactions/{$transactionId}";
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-private-key: ' . config('payment.kkiapay.private_key'),
]);
// Vérifier la réponse avant de valider le paiement
```

---

## 🔴 BUG #4 — Pas de retour download après paiement

### Problème
Après le callback FedaPay/KKiaPay :
- Le token était créé ✅
- Mais **l'utilisateur n'était pas redirigé** vers le lien de téléchargement
- Il devait aller manuellement sur `verifier_paiement.php`

### Fix : API de statut avec polling côté React
```js
// PaymentStatusPage.jsx → polling toutes les 5 secondes
const { data } = await axios.get(`/api/payments/status/${reference}`);

if (data.status === 'paid' && data.download_token) {
    // Redirection automatique vers la page de téléchargement
    navigate(`/download-success?token=${data.download_token}`);
}
```

```php
// PaymentService::checkPaymentStatus() retourne le token
return [
    'status'         => 'paid',
    'download_token' => $download->token,
    'download_url'   => route('download.file', $download->token),
    'download_expires' => $download->expires_at->toISOString(),
];
```

---

## 🟡 BUG #5 — FedaPay return-url ne confirme pas le statut

### Problème
Le `data-return-url` de FedaPay redirige l'utilisateur **après** le paiement,
mais ne signifie pas que le paiement est confirmé — il peut encore être
`pending`. Le webhook est la seule source de vérité.

### Fix : Page de statut avec polling
```
1. FedaPay widget → retour sur /payment/status/{ref}?autocheck=1
2. PaymentStatusPage démarre un polling automatique (5s × 24 = 2min)
3. Dès que status = 'paid' → redirect vers /download-success?token=xxx
```

---

## ✅ Flux de paiement corrigé

### FedaPay (Mobile Money)
```
1. User clique "Acheter"
2. POST /api/payments/initiate → crée transaction pending → retourne reference
3. FedaPayCheckout.init() → widget s'ouvre dans le navigateur
4. User paie → FedaPay ferme le widget
5. FedaPay envoie POST /api/payments/callback/fedapay (webhook)
   └─ PaymentService::handleFedaPayWebhook()
      └─ Lit payload['object']['reference'] et payload['object']['status']
      └─ Si 'approved' → status='paid', génère download token
      └─ Envoie email confirmation
6. FedaPay redirige vers data-return-url = /payment/status/{ref}
7. PaymentStatusPage poll GET /api/payments/status/{ref}
   └─ Si status='paid' → redirect /download-success?token=xxx
8. User télécharge son document ✅
```

### KKiaPay (Carte / Mobile Money)
```
1. User clique "Acheter"
2. POST /api/payments/initiate → crée transaction pending → retourne reference
3. openKkiapayWidget() → widget overlay s'ouvre
4. User paie → onSuccess(response) déclenché avec response.transactionId
5. POST /api/payments/kkiapay/success avec transactionId + reference
   └─ PaymentService::verifyKKiaPayTransaction() → vérifie via API KKiaPay
   └─ Si SUCCESS → status='paid', génère download token
   └─ Retourne { download_token, download_url }
6. Frontend redirect → /download-success?token=xxx
7. En parallèle : KKiaPay peut aussi envoyer un webhook (double sécurité)
8. User télécharge son document ✅
```

---

## 📋 Configuration requise

### .env pour la production
```env
# FedaPay Live
FEDAPAY_PUBLIC_KEY=pk_live_WFzlHFMrcgAHJkISMli9i0-s
FEDAPAY_SECRET_KEY=sk_live_xxxxxxxxxxxxxx
FEDAPAY_ENV=live

# KKiaPay Live
KKIAPAY_PUBLIC_KEY=7cf536653037a4db4dd278cfc8ae4edca378a38b
KKIAPAY_PRIVATE_KEY=votre_cle_privee_kkiapay
KKIAPAY_ENV=live
```

### URLs de callback à configurer dans vos dashboards

**FedaPay Dashboard (https://app.fedapay.com) :**
- Webhook URL : `https://votre-domaine.bj/api/payments/callback/fedapay`
- Événements : `transaction.approved`, `transaction.declined`, `transaction.cancelled`

**KKiaPay Dashboard (https://app.kkiapay.me) :**
- Callback URL : `https://votre-domaine.bj/api/payments/callback/kkiapay`
- Return URL : Configuré dynamiquement dans le widget

### IMPORTANT : Les webhooks doivent être accessibles publiquement
- Désactiver la vérification CSRF pour les routes callbacks (déjà fait dans `bootstrap/app.php`)
- S'assurer que le serveur ne bloque pas les requêtes POST externes

---

## 🐛 Débogage

Les logs de paiement sont dans : `storage/logs/payments.log`

```bash
tail -f storage/logs/payments.log
```

Exemple de log pour FedaPay :
```
2026-01-31 19:43:00 - FedaPay webhook reçu
2026-01-31 19:43:00 - Processed: ref=PAY_1706722980_abc123, status=paid
2026-01-31 19:43:00 - Token créé: d4e5f6...
2026-01-31 19:43:00 - Email envoyé à user@example.com
```
