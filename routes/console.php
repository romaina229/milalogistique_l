<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\Download;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Nettoyage automatique des tokens expirés chaque nuit
Schedule::call(function () {
    // Optionnel: marquer les downloads expirés
    $expired = Download::where('expires_at', '<', now())
        ->whereNull('downloaded_at')
        ->count();

    \Illuminate\Support\Facades\Log::info("Downloads expirés sans téléchargement: {$expired}");
})->daily();
