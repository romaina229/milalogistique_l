<?php

return [

    'fedapay' => [
        'public_key' => env('FEDAPAY_PUBLIC_KEY'),
        'secret_key' => env('FEDAPAY_SECRET_KEY'),
        'env'        => env('FEDAPAY_ENV', 'live'),
    ],

    'kkiapay' => [
        'public_key'  => env('KKIAPAY_PUBLIC_KEY'),
        'private_key' => env('KKIAPAY_PRIVATE_KEY'),
        'env'         => env('KKIAPAY_ENV', 'live'),
    ],

    'paiementpro' => [
        'merchant_id' => env('PAIEMENTPRO_MERCHANT_ID'),
        'env'         => env('PAIEMENTPRO_ENV', 'live'),
        'init_url'    => 'https://www.paiementpro.net/webservice/onlinepayment/init/curl-init.php',
    ],  

    'download_expiry_hours' => env('DOWNLOAD_EXPIRY_HOURS', 72),

    // URL frontend — utilisé pour générer les liens de téléchargement
    // Défini dans .env : FRONTEND_URL=https://milalogistique.vercel.app
    'frontend_url' => env('FRONTEND_URL', env('APP_URL', 'http://localhost:3000')),

];