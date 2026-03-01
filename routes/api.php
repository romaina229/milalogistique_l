<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\DownloadController;
use App\Http\Controllers\Admin\AdminDocumentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Auth
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'changePassword']);
    });
});

// Documents (public)
Route::get('/documents', [DocumentController::class, 'index']);
Route::get('/documents/{id}', [DocumentController::class, 'show']);
Route::get('/categories', [DocumentController::class, 'categories']);

// Authenticated user routes
Route::middleware('auth:sanctum')->group(function () {
    // My documents
    Route::get('/my-documents', [DocumentController::class, 'myDocuments']);

    // Payment routes
    Route::prefix('payments')->group(function () {
        Route::post('/initiate', [PaymentController::class, 'initiate']);
        Route::get('/status/{reference}', [PaymentController::class, 'status'])
            ->name('payment.status');
        Route::post('/kkiapay/success', [PaymentController::class, 'kkiapaySuccess']);
        Route::post('/fedapay/return', [PaymentController::class, 'fedapayReturn']);
    });

    // Download info
    Route::get('/downloads/info/{token}', [DownloadController::class, 'info']);
});

// Payment Webhooks (NO auth - called by payment providers)
Route::prefix('payments')->group(function () {
    Route::post('/callback/fedapay', [PaymentController::class, 'callbackFedaPay'])
        ->name('payment.callback.fedapay')
        ->withoutMiddleware(['auth:sanctum', 'throttle:api']);

    Route::post('/callback/kkiapay', [PaymentController::class, 'callbackKKiaPay'])
        ->name('payment.callback.kkiapay')
        ->withoutMiddleware(['auth:sanctum', 'throttle:api']);
});

// Admin routes
Route::prefix('admin')
    ->middleware(['auth:sanctum', 'admin'])
    ->group(function () {
        Route::get('/dashboard', [AdminDocumentController::class, 'dashboard']);
        Route::apiResource('/documents', AdminDocumentController::class);
        Route::patch('/documents/{document}/toggle', [AdminDocumentController::class, 'toggle']);
        Route::get('/transactions', [AdminDocumentController::class, 'transactions']);
        Route::get('/users', [AdminDocumentController::class, 'users']);

        // Categories CRUD
        Route::apiResource('/categories', \App\Http\Controllers\Admin\AdminCategoryController::class);
    });

// Régénérer lien de téléchargement (utilisateur)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/my-documents/{transactionId}/regenerate-link',
        [\App\Http\Controllers\Api\DownloadController::class, 'regenerateLink']
    );
});

// Routes Admin supplémentaires
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    // CRUD Utilisateurs
    Route::put('/users/{user}', [\App\Http\Controllers\Admin\AdminUserController::class, 'update']);
    Route::delete('/users/{user}', [\App\Http\Controllers\Admin\AdminUserController::class, 'destroy']);
    Route::patch('/users/{user}/toggle', [\App\Http\Controllers\Admin\AdminUserController::class, 'toggle']);
    Route::get('/users/{user}/downloads', [\App\Http\Controllers\Admin\AdminUserController::class, 'downloads']);

    // Régénérer lien admin
    Route::post('/transactions/{transaction}/regenerate-link', [\App\Http\Controllers\Admin\AdminUserController::class, 'regenerateLink']);
});