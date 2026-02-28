<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
            'http://localhost:3000',  // React
            'https://milalogistique.vercel.app/',   // React
            'http://localhost:5173',   // Vite (port alternatif)
            env('FRONTEND_URL', 'https://milalogistique.vercel.app'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
