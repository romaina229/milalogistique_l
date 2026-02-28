<?php

return [
    'fedapay' => [
        'public_key' => env('FEDAPAY_PUBLIC_KEY', ''),
        'secret_key' => env('FEDAPAY_SECRET_KEY', ''),
        'env' => env('FEDAPAY_ENV', 'sandbox'),
    ],

    'kkiapay' => [
        'public_key' => env('KKIAPAY_PUBLIC_KEY', ''),
        'private_key' => env('KKIAPAY_PRIVATE_KEY', ''),
        'env' => env('KKIAPAY_ENV', 'sandbox'),
        'verify_url' => [
            'live' => 'https://api.kkiapay.me/api/v1/transactions/',
            'sandbox' => 'https://sandbox-api.kkiapay.me/api/v1/transactions/',
        ],
    ],

    'download_expiry_hours' => env('DOWNLOAD_EXPIRY_HOURS', 72),
    'currency' => 'XOF',
    'currency_symbol' => 'FCFA',
];
