<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Transaction;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    /**
     * URL de téléchargement vers le frontend (jamais localhost)
     */
    private function downloadUrl(string $token): string
    {
        $base = rtrim(config('payment.frontend_url', config('app.url')), '/');
        return $base . '/download-success?token=' . $token;
    }

    /**
     * POST /api/payments/initiate
     */
    public function initiate(Request $request): JsonResponse
    {
        $request->validate([
            'document_id'    => 'required|exists:documents,id',
            'payment_method' => 'required|in:fedapay,kkiapay',
            'phone'          => 'nullable|string|max:20',
        ]);

        $user     = Auth::user();
        $document = Document::where('id', $request->document_id)
            ->where('is_active', true)
            ->firstOrFail();

        // Déjà acheté
        $existing = Transaction::where('user_id', $user->id)
            ->where('document_id', $document->id)
            ->where('status', 'paid')
            ->with('download')
            ->first();

        if ($existing) {
            $download = $existing->download;
            $token = $download && $download->isValid()
                ? $download->token
                : $this->paymentService->generateDownloadToken($existing);

            return response()->json([
                'already_purchased' => true,
                'download_token'    => $token,
                'download_url'      => $this->downloadUrl($token),
                'message'           => 'Vous avez déjà acheté ce document.',
            ]);
        }

        $transaction = $this->paymentService->createTransaction(
            $user, $document, $request->payment_method, $request->phone
        );

        return response()->json([
            'success'        => true,
            'transaction_id' => $transaction->id,
            'reference'      => $transaction->payment_reference,
            'amount'         => (int) $transaction->amount,
            'currency'       => 'XOF',
            'payment_method' => $request->payment_method,
            'document'       => ['id' => $document->id, 'title' => $document->title],
            'callback_url'   => url('/api/payments/callback/' . $request->payment_method),
            'status_url'     => url('/api/payments/status/' . $transaction->payment_reference),
        ]);
    }

    /**
     * POST /api/payments/callback/fedapay — Webhook FedaPay
     */
    public function callbackFedaPay(Request $request): JsonResponse
    {
        Log::info('FedaPay callback reçu', ['body' => $request->all()]);
        try {
            $result = $this->paymentService->handleFedaPayWebhook($request->all());
            return response()->json(['success' => true, 'status' => $result['status'] ?? null], 200);
        } catch (\Exception $e) {
            Log::error('FedaPay callback erreur', ['error' => $e->getMessage()]);
            return response()->json(['received' => true], 200);
        }
    }

    /**
     * POST /api/payments/callback/kkiapay — Webhook KKiaPay
     */
    public function callbackKKiaPay(Request $request): JsonResponse
    {
        Log::info('KKiaPay callback reçu', ['body' => $request->all()]);
        try {
            $result = $this->paymentService->handleKKiaPayWebhook($request->all());
            return response()->json(['success' => true, 'status' => $result['status'] ?? null], 200);
        } catch (\Exception $e) {
            Log::error('KKiaPay callback erreur', ['error' => $e->getMessage()]);
            return response()->json(['received' => true], 200);
        }
    }

    /**
     * GET /api/payments/status/{reference}
     */
    public function status(string $reference): JsonResponse
    {
        $user   = Auth::user();
        $result = $this->paymentService->checkPaymentStatus($reference);

        if (!$result['found']) {
            return response()->json(['error' => 'Transaction non trouvée'], 404);
        }

        $transaction = Transaction::where('payment_reference', $reference)->first();
        if ($transaction && $transaction->user_id !== $user->id) {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        return response()->json($result);
    }

    /**
     * POST /api/payments/kkiapay/success
     * ============================================================
     * FIX DÉFINITIF : Le frontend envoie transactionId après succès
     * widget KKiaPay. On marque la transaction comme PAID directement
     * sans attendre le webhook (qui peut être lent ou bloqué).
     * ============================================================
     */
    public function kkiapaySuccess(Request $request): JsonResponse
    {
        $request->validate([
            'transactionId' => 'required|string',
            'reference'     => 'required|string',
        ]);

        $user = Auth::user();

        Log::info('KKiaPay success frontend', [
            'transactionId' => $request->transactionId,
            'reference'     => $request->reference,
            'user_id'       => $user->id,
        ]);

        $transaction = Transaction::where('payment_reference', $request->reference)
            ->where('user_id', $user->id)
            ->first();

        if (!$transaction) {
            return response()->json(['error' => 'Transaction non trouvée'], 404);
        }

        // Déjà payée → retourner token directement
        if ($transaction->status === 'paid') {
            $download = $transaction->download;
            $token = $download && $download->isValid()
                ? $download->token
                : $this->paymentService->generateDownloadToken($transaction);

            return response()->json([
                'success'        => true,
                'status'         => 'paid',
                'download_token' => $token,
                'download_url'   => $this->downloadUrl($token),
            ]);
        }

        // ✅ FIX : Marquer comme PAID immédiatement avec le transactionId KKiaPay
        // KKiaPay confirme le paiement côté widget → on fait confiance à ce signal
        // Le webhook viendra confirmer plus tard mais on n'attend pas
        $transaction->update([
            'status'             => 'paid',
            'gateway_transaction_id' => $request->transactionId,
            'paid_at'            => now(),
        ]);

        $token = $this->paymentService->generateDownloadToken($transaction);

        // Envoyer email confirmation
        try {
            $this->paymentService->sendConfirmationEmail($transaction, $token);
        } catch (\Exception $e) {
            Log::error('Email confirmation erreur', ['error' => $e->getMessage()]);
        }

        Log::info('KKiaPay transaction marquée paid', [
            'reference' => $request->reference,
            'token'     => $token,
        ]);

        return response()->json([
            'success'        => true,
            'status'         => 'paid',
            'download_token' => $token,
            'download_url'   => $this->downloadUrl($token),
        ]);
    }

    /**
     * POST /api/payments/fedapay/success
     */
    public function fedapayReturn(Request $request): JsonResponse
    {
        $reference = $request->get('ref') ?? $request->get('reference');

        if (!$reference) {
            return response()->json(['error' => 'Référence manquante'], 400);
        }

        $user   = Auth::user();
        $result = $this->paymentService->checkPaymentStatus($reference);

        if (!$result['found']) {
            return response()->json(['error' => 'Transaction non trouvée'], 404);
        }

        $transaction = Transaction::where('payment_reference', $reference)->first();
        if ($transaction && $transaction->user_id !== $user->id) {
            return response()->json(['error' => 'Accès non autorisé'], 403);
        }

        return response()->json($result);
    }
}
