<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Transaction;
use App\Models\Download;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    /**
     * Génère l'URL de téléchargement vers le FRONTEND (pas le backend)
     * Utilise FRONTEND_URL dans .env → https://milalogistique.vercel.app
     */
    private function downloadUrl(string $token): string
    {
        $base = rtrim(env('FRONTEND_URL', config('app.url')), '/');
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

        // Vérifier si déjà acheté
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
            // callback_url et status_url → routes backend (normales)
            'callback_url'   => url('/api/payments/callback/' . $request->payment_method),
            'status_url'     => url('/api/payments/status/' . $transaction->payment_reference),
        ]);
    }

    /**
     * POST /api/payments/callback/fedapay — Webhook FedaPay
     */
    public function callbackFedaPay(Request $request): JsonResponse
    {
        Log::channel('payments')->info('FedaPay callback', ['body' => $request->all()]);

        try {
            $result = $this->paymentService->handleFedaPayWebhook($request->all());

            if (!$result['success'] && isset($result['error'])) {
                if ($result['error'] === 'transaction_not_found') {
                    return response()->json(['received' => true, 'error' => $result['error']], 200);
                }
                return response()->json(['error' => $result['error']], 400);
            }

            return response()->json([
                'success'        => true,
                'status'         => $result['status'],
                'download_token' => $result['download_token'] ?? null,
            ], 200);

        } catch (\Exception $e) {
            Log::channel('payments')->error('FedaPay callback exception', ['error' => $e->getMessage()]);
            return response()->json(['received' => true], 200);
        }
    }

    /**
     * POST /api/payments/callback/kkiapay — Webhook KKiaPay
     */
    public function callbackKKiaPay(Request $request): JsonResponse
    {
        Log::channel('payments')->info('KKiaPay callback', ['body' => $request->all()]);

        try {
            $result = $this->paymentService->handleKKiaPayWebhook($request->all());

            return response()->json([
                'success'        => $result['success'],
                'status'         => $result['status'] ?? null,
                'download_token' => $result['download_token'] ?? null,
            ], 200);

        } catch (\Exception $e) {
            Log::channel('payments')->error('KKiaPay callback exception', ['error' => $e->getMessage()]);
            return response()->json(['received' => true], 200);
        }
    }

    /**
     * GET /api/payments/status/{reference} — Polling frontend
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
     * POST /api/payments/kkiapay/success — Confirmation frontend KKiaPay
     */
    public function kkiapaySuccess(Request $request): JsonResponse
    {
        $request->validate([
            'transactionId' => 'required|string',
            'reference'     => 'required|string',
        ]);

        $user = Auth::user();
        $transaction = Transaction::where('payment_reference', $request->reference)
            ->where('user_id', $user->id)
            ->first();

        if (!$transaction) {
            return response()->json(['error' => 'Transaction non trouvée'], 404);
        }

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

        $result = $this->paymentService->handleKKiaPayWebhook([
            'transactionId' => $request->transactionId,
            'status'        => 'SUCCESS',
            'data'          => ['reference' => $request->reference],
        ]);

        if ($result['success'] && $result['status'] === 'paid') {
            return response()->json([
                'success'        => true,
                'status'         => 'paid',
                'download_token' => $result['download_token'],
                'download_url'   => $this->downloadUrl($result['download_token']),
            ]);
        }

        return response()->json([
            'success' => false,
            'status'  => $result['status'] ?? 'pending',
            'message' => 'Vérification en cours...',
        ]);
    }

    /**
     * POST /api/payments/fedapay/success — Return URL FedaPay
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