<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name', 'Milla Logistique') }}</title>
    <link rel="icon" type="image/jpeg" href="{{ asset('images/logomilla.jpeg') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
</head>
<body class="bg-gray-50 font-sans antialiased">
    <div id="app"></div>
    
    <script>
        window.APP_CONFIG = {
            appUrl: '{{ config("app.url") }}',
            appName: '{{ config("app.name") }}',
            csrfToken: '{{ csrf_token() }}',
            kkiapayPublicKey: '{{ config("payment.kkiapay.public_key") }}',
            fedapayPublicKey: '{{ config("payment.fedapay.public_key") }}',
            fedapayEnv: '{{ config("payment.fedapay.env") }}',
        };
    </script>
    
    {{-- KKiaPay SDK --}}
    <script src="https://cdn.kkiapay.me/k.js"></script>
    {{-- FedaPay SDK --}}
    <script src="https://cdn.fedapay.com/checkout.js?v=1.1.7"></script>
</body>
</html>
