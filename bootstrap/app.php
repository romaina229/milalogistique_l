<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        /*
        |----------------------------------------------------------------------
        | ⚠️  NE PAS décommenter EnsureFrontendRequestsAreStateful
        |----------------------------------------------------------------------
        | Ce middleware active l'authentification par COOKIE + CSRF.
        | Si votre React tourne sur un port différent (ex: :3000 ou :5173)
        | et que Laravel tourne sur :8000, toutes les requêtes POST
        | retourneront une ERREUR 419 (CSRF token mismatch).
        |
        | On utilise ici le Bearer Token uniquement (Sanctum token auth).
        | Le frontend envoie : Authorization: Bearer {token}
        |
        | // $middleware->api(prepend: [
        | //     \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        | // ]);
        */

        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);

        // Exclure les routes API du CSRF — déjà le cas dans Laravel 11
        // mais on le rend explicite pour éviter toute ambiguïté
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {

        // Retourner JSON pour les erreurs 401 sur les routes API
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['error' => 'Non authentifié.'], 401);
            }
        });

        // Retourner JSON pour les erreurs de validation sur les routes API
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Données invalides.',
                    'errors'  => $e->errors(),
                ], 422);
            }
        });

    })->create();