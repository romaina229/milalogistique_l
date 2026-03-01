<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\Download;
use App\Models\Document;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\PaymentConfirmation;


class PaymentService
{
    /**
     * Crée une transaction en attente
     */
    public function createTransaction(User $user, Document $document, string $method, ?string $phone = null): Transaction
    {
        // Vérifier si une transaction payée existe déjà
        $existing = Transaction::where('user_id', $user->id)
            ->where('document_id', $document->id)
            ->where('status', 'paid')
            ->first();

        if ($existing) {
            return $existing;
        }

        return Transaction::create([
            'user_id'           => $user->id,
            'document_id'       => $document->id,
            'amount'            => $document->price,
            'status'            => 'pending',
            'payment_method'    => $method,
            'payment_reference' => 'PAY_' . time() . '_' . Str::random(8),
            'phone'             => $phone,
            'email'             => $user->email,
        ]);
    }

    /**
     * =====================================================================
     * FEDAPAY WEBHOOK HANDLER
     * =====================================================================
     * FedaPay envoie un webhook avec cette structure JSON :
     * {
     *   "id": 1,
     *   "name": "transaction.approved",
     *   "object": {
     *     "id": 123456,
     *     "reference": "PAY_xxx_xxx",
     *     "status": "approved",
     *     "amount": 500,
     *     "currency": {"iso": "XOF"},
     *     "customer": {...},
     *     ...
     *   }
     * }
     *
     * Status possibles : approved, transferred, declined, cancelled, pending
     */
    public function handleFedaPayWebhook(array $payload): array
    {
        Log::channel('payments')->info('FedaPay webhook reçu', $payload);

        // Extraire l'objet transaction depuis le webhook
        $eventName = $payload['name'] ?? '';
        $txObject  = $payload['object'] ?? $payload; // fallback si format direct

        $reference = $txObject['reference'] ?? $txObject['ref'] ?? null;
        $status    = $txObject['status'] ?? $txObject['state'] ?? null;
        $amount    = $txObject['amount'] ?? 0;
        $externalId = (string)($txObject['id'] ?? '');

        if (!$reference) {
            Log::channel('payments')->error('FedaPay: reference manquante', $payload);
            return ['success' => false, 'error' => 'reference_missing'];
        }

        $transaction = Transaction::where('payment_reference', $reference)->first();

        if (!$transaction) {
            Log::channel('payments')->error('FedaPay: transaction non trouvée', ['reference' => $reference]);
            return ['success' => false, 'error' => 'transaction_not_found'];
        }

        // Ignorer si déjà traitée (idempotence)
        if ($transaction->status === 'paid') {
            Log::channel('payments')->info('FedaPay: transaction déjà payée', ['reference' => $reference]);
            return ['success' => true, 'status' => 'already_paid', 'download_token' => $transaction->download?->token];
        }

        // Mapper les statuts FedaPay
        $newStatus = $this->mapFedaPayStatus($status);

        // Mettre à jour la transaction
        $transaction->update([
            'status'             => $newStatus,
            'external_reference' => $externalId,
            'payment_data'       => $txObject,
            'updated_at'         => now(),
        ]);

        Log::channel('payments')->info('FedaPay: transaction mise à jour', [
            'reference' => $reference,
            'status'    => $newStatus,
        ]);

        $downloadToken = null;

        // Si paiement réussi, générer le token de téléchargement
        if ($newStatus === 'paid') {
            $downloadToken = $this->generateDownloadToken($transaction);
            $this->sendConfirmationEmail($transaction, $downloadToken);
        }

        return [
            'success'        => true,
            'status'         => $newStatus,
            'reference'      => $reference,
            'download_token' => $downloadToken,
        ];
    }

    /**
     * =====================================================================
     * KKIAPAY WEBHOOK HANDLER
     * =====================================================================
     * KKiaPay envoie un webhook avec cette structure :
     * {
     *   "transactionId": "xxxxxxxxxxxxxxxx",
     *   "status": "SUCCESS",
     *   "amount": 500,
     *   "paymentMethod": "mtn-benin",
     *   "data": {"reference": "PAY_xxx_xxx"},
     *   ...
     * }
     *
     * Il faut VÉRIFIER le paiement via l'API KKiaPay avant de valider.
     * Status possibles : SUCCESS, FAILED, PENDING, CANCELLED
     */
    public function handleKKiaPayWebhook(array $payload): array
    {
        Log::channel('payments')->info('KKiaPay webhook reçu', $payload);

        $kkiapayTransactionId = $payload['transactionId'] ?? null;
        $status               = $payload['status'] ?? null;

        if (!$kkiapayTransactionId) {
            Log::channel('payments')->error('KKiaPay: transactionId manquant', $payload);
            return ['success' => false, 'error' => 'transaction_id_missing'];
        }

        // Récupérer la référence depuis les données custom
        $reference = $payload['data']['reference']
            ?? $payload['metadata']['reference']
            ?? $payload['reference']
            ?? null;

        if (!$reference) {
            // Chercher par external_reference
            $transaction = Transaction::where('external_reference', $kkiapayTransactionId)->first();
        } else {
            $transaction = Transaction::where('payment_reference', $reference)->first();
        }

        if (!$transaction) {
            Log::channel('payments')->error('KKiaPay: transaction non trouvée', [
                'transactionId' => $kkiapayTransactionId,
                'reference'     => $reference,
            ]);
            return ['success' => false, 'error' => 'transaction_not_found'];
        }

        // Idempotence
        if ($transaction->status === 'paid') {
            return ['success' => true, 'status' => 'already_paid', 'download_token' => $transaction->download?->token];
        }

        // VÉRIFICATION obligatoire via API KKiaPay
        $verified = $this->verifyKKiaPayTransaction($kkiapayTransactionId);

        if (!$verified['success']) {
            Log::channel('payments')->error('KKiaPay: vérification échouée', $verified);
            $transaction->update([
                'status'       => 'failed',
                'payment_data' => array_merge($payload, ['verification_error' => $verified]),
            ]);
            return ['success' => false, 'error' => 'verification_failed'];
        }

        $newStatus = $this->mapKKiaPayStatus($verified['status'] ?? $status);

        $transaction->update([
            'status'             => $newStatus,
            'external_reference' => $kkiapayTransactionId,
            'payment_data'       => array_merge($payload, ['verification' => $verified]),
        ]);

        $downloadToken = null;

        if ($newStatus === 'paid') {
            $downloadToken = $this->generateDownloadToken($transaction);
            $this->sendConfirmationEmail($transaction, $downloadToken);
        }

        Log::channel('payments')->info('KKiaPay: transaction traitée', [
            'transactionId' => $kkiapayTransactionId,
            'status'        => $newStatus,
        ]);

        return [
            'success'        => true,
            'status'         => $newStatus,
            'download_token' => $downloadToken,
        ];
    }

    /**
     * Vérification du paiement KKiaPay via leur API REST
     */
    private function verifyKKiaPayTransaction(string $transactionId): array
    {
        $env     = config('payment.kkiapay.env', 'sandbox');
        $baseUrl = config("payment.kkiapay.verify_url.{$env}");
        $privKey = config('payment.kkiapay.private_key');

        try {
            $ch = curl_init("{$baseUrl}{$transactionId}");
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER     => [
                    'x-private-key: ' . $privKey,
                    'Content-Type: application/json',
                ],
                CURLOPT_TIMEOUT => 15,
                CURLOPT_SSL_VERIFYPEER => $env === 'live',
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200 || !$response) {
                return ['success' => false, 'error' => 'http_error', 'code' => $httpCode];
            }

            $data = json_decode($response, true);

            return [
                'success' => true,
                'status'  => $data['status'] ?? 'UNKNOWN',
                'data'    => $data,
            ];
        } catch (\Exception $e) {
            Log::channel('payments')->error('KKiaPay verification exception', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Génère le token de téléchargement sécurisé
     */
    public function generateDownloadToken(Transaction $transaction): string
    {
        // Vérifier si un token valide existe déjà
        $existing = Download::where('transaction_id', $transaction->id)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>', now());
            })
            ->first();

        if ($existing) {
            return $existing->token;
        }

        $token     = Str::random(64);
        $expiresAt = now()->addHours((int) config('payment.download_expiry_hours', 72));

        Download::create([
            'transaction_id' => $transaction->id,
            'user_id'        => $transaction->user_id,
            'document_id'    => $transaction->document_id,
            'token'          => $token,
            'expires_at'     => $expiresAt,
        ]);

        // Incrémenter compteur téléchargements
        $transaction->document?->increment('downloads');

        return $token;
    }

    /**
     * Vérifier le statut d'un paiement et retourner le token si payé
     */
    public function checkPaymentStatus(string $reference): array
    {
        $transaction = Transaction::where('payment_reference', $reference)
            ->with(['document', 'download'])
            ->first();

        if (!$transaction) {
            return ['found' => false];
        }

        $result = [
            'found'      => true,
            'status'     => $transaction->status,
            'reference'  => $reference,
            'amount'     => $transaction->amount,
            'method'     => $transaction->payment_method,
            'created_at' => $transaction->created_at->toISOString(),
        ];

        if ($transaction->status === 'paid') {
            $download = $transaction->download;
            if ($download && $download->isValid()) {
                $result['download_token']   = $download->token;
                $result['download_url']     = rtrim(config('payment.frontend_url', config('app.url')), '/') . '/download-success?token=' . $download->token;
                $result['download_expires'] = $download->expires_at->toISOString();
            } else {
                // Régénérer si expiré
                $token = $this->generateDownloadToken($transaction);
                $result['download_token'] = $token;
                $result['download_url']   = rtrim(config('payment.frontend_url', config('app.url')), '/') . '/download-success?token=' . $token;
            }
            $result['document'] = [
                'id'    => $transaction->document?->id,
                'title' => $transaction->document?->title,
            ];
        }

        return $result;
    }

    /**
     * Mapper les statuts FedaPay → statuts internes
     */
    private function mapFedaPayStatus(string $status): string
    {
        return match (strtolower($status)) {
            'approved', 'success', 'completed', 'transferred', 'paid' => 'paid',
            'declined', 'failed', 'error'                              => 'failed',
            'cancelled', 'canceled'                                    => 'cancelled',
            default                                                    => 'pending',
        };
    }

    /**
     * Mapper les statuts KKiaPay → statuts internes
     */
    private function mapKKiaPayStatus(string $status): string
    {
        return match (strtoupper($status)) {
            'SUCCESS', 'COMPLETED', 'APPROVED' => 'paid',
            'FAILED', 'ERROR'                  => 'failed',
            'CANCELLED', 'CANCELED'            => 'cancelled',
            default                            => 'pending',
        };
    }

    /**
     * Envoyer email de confirmation avec lien de téléchargement
     */
    public function sendConfirmationEmail(Transaction $transaction, string $downloadToken): void
    {
        try {
            $transaction->load(['user', 'document']);

            if ($transaction->user) {
                Mail::to($transaction->user->email)
                    ->queue(new PaymentConfirmation($transaction, $downloadToken));
            }
        } catch (\Exception $e) {
            Log::error('Erreur envoi email confirmation', ['error' => $e->getMessage()]);
        }
    }
}
