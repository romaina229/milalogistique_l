<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use App\Models\Download;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminUserController extends Controller
{
    public function __construct(private PaymentService $paymentService) {}

    /**
     * Modifier un utilisateur
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'name'      => 'sometimes|string|max:255',
            'email'     => 'sometimes|email|unique:users,email,' . $user->id,
            'phone'     => 'nullable|string|max:20',
            'role'      => 'sometimes|in:user,admin',
            'is_active' => 'sometimes|boolean',
        ]);

        $data = $request->only(['name', 'email', 'phone', 'is_active']);

        // Gérer le rôle → is_admin
        if ($request->has('role')) {
            $data['is_admin'] = $request->role === 'admin';
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur mis à jour',
            'user'    => $user->fresh(),
        ]);
    }

    /**
     * Supprimer un utilisateur
     */
    public function destroy(User $user): JsonResponse
    {
        // Empêcher suppression de soi-même
        if ($user->id === auth()->id()) {
            return response()->json(['error' => 'Vous ne pouvez pas supprimer votre propre compte'], 403);
        }

        $user->delete();

        return response()->json(['success' => true, 'message' => 'Utilisateur supprimé']);
    }

    /**
     * Activer / désactiver un utilisateur
     */
    public function toggle(User $user): JsonResponse
    {
        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'success'   => true,
            'is_active' => $user->is_active,
            'message'   => $user->is_active ? 'Utilisateur activé' : 'Utilisateur désactivé',
        ]);
    }

    /**
     * Téléchargements d'un utilisateur
     */
    public function downloads(User $user): JsonResponse
    {
        $transactions = Transaction::where('user_id', $user->id)
            ->where('status', 'paid')
            ->with(['document', 'download'])
            ->latest()
            ->get()
            ->map(function ($tx) {
                return [
                    'id'                => $tx->id,
                    'document'          => $tx->document ? ['id' => $tx->document->id, 'title' => $tx->document->title] : null,
                    'payment_reference' => $tx->payment_reference,
                    'amount'            => $tx->amount,
                    'payment_method'    => $tx->payment_method,
                    'purchased_at'      => $tx->created_at,
                    'download'          => $tx->download ? [
                        'token'      => $tx->download->token,
                        'expires_at' => $tx->download->expires_at,
                        'is_valid'   => $tx->download->isValid(),
                    ] : null,
                ];
            });

        return response()->json(['data' => $transactions]);
    }

    /**
     * Régénérer lien de téléchargement (admin)
     */
    public function regenerateLink(Transaction $transaction): JsonResponse
    {
        if ($transaction->status !== 'paid') {
            return response()->json(['error' => 'Transaction non payée'], 400);
        }

        // Supprimer l'ancien download
        Download::where('transaction_id', $transaction->id)->delete();

        // Générer nouveau token
        $token = $this->paymentService->generateDownloadToken($transaction);

        return response()->json([
            'success'        => true,
            'download_token' => $token,
            'message'        => 'Lien régénéré avec succès',
        ]);
    }
}
