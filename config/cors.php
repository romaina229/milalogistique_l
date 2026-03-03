<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        // Production Vercel
        'https://milalogistique.vercel.app', 'https://www.paiementpro.net',
        // Local développement
        'http://localhost:3000',
        'http://localhost:5173',
        // Depuis .env
        env('FRONTEND_URL', 'http://localhost:3000'),
    ],

    'allowed_origins_patterns' => [
        // Autorise tous les previews Vercel
        '#^https://.*\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => false,

];