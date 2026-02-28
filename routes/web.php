<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DownloadController;

/*
|--------------------------------------------------------------------------
| Web Routes — Backend API only
|--------------------------------------------------------------------------
| Le frontend React tourne séparément (npm run dev sur port 5173).
| Laravel ne sert PAS de pages HTML ici.
*/

// Route de téléchargement (token 72h)
Route::get('/download/{token}', [DownloadController::class, 'download'])
    ->name('download.file');

// Page d'accueil = JSON info (plus de vue Blade/Vite)
Route::get('/', function () {
    return response()->json([
        'app'    => config('app.name'),
        'status' => 'running ✓',
        'api'    => url('/api'),
        'docs'   => 'Voir README.md',
    ]);
});