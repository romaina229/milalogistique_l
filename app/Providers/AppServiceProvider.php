<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Forcer HTTPS en production (Render, Heroku, etc.)
        // Évite les liens http://localhost:8000 dans les réponses API
        if (config('app.env') === 'production' || config('app.url') !== 'http://localhost:8000') {
            URL::forceScheme('https');
            URL::forceRootUrl(config('app.url'));
        }
    }
}