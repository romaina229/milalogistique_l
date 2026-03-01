<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Download;
use App\Models\Transaction;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DownloadController extends Controller
{
    /**
     * GET /download/{token}
     */
    public function download(string $token): mixed
    {
        $download = Download::where('token', $token)
            ->with(['document', 'transaction'])
            ->first();

        if (!$download) {
            return response()->json(['error' => 'Token invalide'], 404);
        }

        if ($download->isExpired()) {
            return response()->json([
                'error'   => 'expired',
                'message' => 'Ce lien de téléchargement a expiré. Veuillez contacter le support.',
            ], 410);
        }

        if (!$download->transaction || $download->transaction->status !== 'paid') {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        $document = $download->document;

        if (!$document) {
            return response()->json(['error' => 'Document non trouvé'], 404);
        }

        $download->update([
            'downloaded_at' => now(),
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->userAgent(),
        ]);

        if ($document->file_type === 'drive' || filter_var($document->file_path, FILTER_VALIDATE_URL)) {
            return redirect($document->file_path);
        }

        $filePath = $document->file_path;

        if (!Storage::exists($filePath)) {
            return response()->json(['error' => 'Fichier introuvable sur le serveur'], 404);
        }

        $fileName = $document->file_name ?: basename($filePath);

        return Storage::download($filePath, $fileName, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
            'Pragma'              => 'no-cache',
            'Expires'             => '0',
        ]);
    }

    /**
     * GET /api/downloads/info/{token}
     */
    public function info(string $token): JsonResponse
    {
        $download = Download::where('token', $token)
            ->with(['document', 'transaction'])
            ->first();

        if (!$download) {
            return response()->json(['error' => 'Token invalide'], 404);
        }

        return response()->json([
            'valid'      => $download->isValid(),
            'expired'    => $download->isExpired(),
            'expires_at' => $download->expires_at?->toISOString(),
            'document'   => $download->document ? [
                'id'    => $download->document->id,
                'title' => $download->document->title,
            ] : null,
        ]);
    }

    /**
     * POST /api/my-documents/{transactionId}/regenerate-link
     */
    public function regenerateLink(string $transactionId): JsonResponse
    {
        $user = Auth::user();

        $transaction = Transaction::where('id', $transactionId)
            ->where('user_id', $user->id)
            ->where('status', 'paid')
            ->firstOrFail();

        // Supprimer l'ancien token
        Download::where('transaction_id', $transaction->id)->delete();

        // Générer nouveau token
        $token = app(PaymentService::class)->generateDownloadToken($transaction);

        return response()->json([
            'success'        => true,
            'download_token' => $token,
            'message'        => 'Nouveau lien généré avec succès',
        ]);
    }
}