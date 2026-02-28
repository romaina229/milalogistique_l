<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
<<<<<<< HEAD
            'http://localhost:3000', 'https://milalogistique.vercel.app',  // React
=======
            'https://milalogistique.vercel.app/',   // React
>>>>>>> 5a8754d3782944a97d2f6af19f3142536511227b
            'http://localhost:5173',   // Vite (port alternatif)
            env('FRONTEND_URL'),
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
