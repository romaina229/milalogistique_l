# 🚀 Milla Logistique - Application Laravel + React

## Analyse complète du projet existant & Migration

### Structure originale (PHP natif)
- **Authentification** : Sessions PHP, register/login/logout
- **Documents** : CRUD admin, upload fichier ou lien Drive, catégories, tags
- **Paiements** : FedaPay (Mobile Money) + KiaPay (Carte bancaire) 
- **Téléchargements** : Token sécurisé 72h, Google Drive ou fichier serveur
- **Admin** : Dashboard, statistiques, logs, transactions, utilisateurs
- **Base de données** : MySQL avec tables : utilisateurs, documents, transactions, telechargements, categories, parametres, logs_admin

### Bugs identifiés dans le code original

#### 🔴 Bug critique FedaPay callback
Le callback FedaPay reçoit un webhook avec la structure:
```json
{"id": 123, "reference": "PAY_xxx", "status": "approved", "amount": {...}}
```
Le code cherche `$data['reference']` mais FedaPay envoie l'événement sous forme:
```json
{"name": "transaction.approved", "object": {"id": 123, "reference": "PAY_xxx", ...}}
```
**Fix**: Parser correctement `$data['object']['reference']` et `$data['object']['status']`

#### 🔴 Bug KiaPay - CDN incorrect
Le script charge `cdn.kiapay.io/kiapay-widget.js` mais le bon CDN est `cdn.kkiapay.me/k.js`.
Le code mélange les deux et a une syntaxe JS invalide avec `src=` en dehors de la balise script.

#### 🟡 Token de téléchargement non retourné après paiement
Après callback success, l'utilisateur ne reçoit pas automatiquement le lien de téléchargement - il doit aller sur `verifier_paiement.php` manuellement.

---

## Stack technique Laravel + React

- **Backend** : Laravel 11 + Sanctum (API auth)
- **Frontend** : React 18 + Vite + TailwindCSS
- **Paiements** : FedaPay SDK PHP + KKiaPay
- **Base de données** : MySQL (même schéma enrichi)
- **Email** : Laravel Mail + SMTP
- **Storage** : Laravel Storage (local + cloud ready)

---

## Installation

```bash
# 1. Cloner et installer les dépendances
composer install
npm install

# 2. Configuration
cp .env.example .env
php artisan key:generate

# 3. Base de données
php artisan migrate --seed

# 4. Storage
php artisan storage:link

# 5. Build assets
npm run build

# 6. Serveur de dev
php artisan serve
npm run dev
```

## Variables .env requises

```env
APP_NAME="Milla Logistique"
APP_URL=https://votre-domaine.bj
DB_DATABASE=milla_logistique

# FedaPay
FEDAPAY_PUBLIC_KEY=pk_live_WFzlHFMrcgAHJkISMli9i0-s
FEDAPAY_SECRET_KEY=sk_live_xxxxxxxxxxxx
FEDAPAY_ENV=live

# KKiaPay
KKIAPAY_PUBLIC_KEY=7cf536653037a4db4dd278cfc8ae4edca378a38b
KKIAPAY_PRIVATE_KEY=pk_xxxxxxxxxxxxx
KKIAPAY_ENV=live

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=milalogistique@gmail.com
MAIL_PASSWORD=xxxx
MAIL_FROM_ADDRESS=milalogistique@gmail.com
MAIL_FROM_NAME="Milla Logistique"
```
