<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        URL::forceRootUrl(config('app.url'));

        // Forcer HTTPS si APP_URL commence par https
        if (str_starts_with(config('app.url'), 'https')) {
            URL::forceScheme('https');
        }
    }
}