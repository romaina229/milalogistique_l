<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    /**
     * GET /api/documents
     * Liste publique des documents avec pagination et filtres
     */
    public function index(Request $request): JsonResponse
    {
        $query = Document::with('category')
            ->where('is_active', true)
            ->latest();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        if ($category = $request->get('category')) {
            $query->where('category', $category)
                  ->orWhereHas('category', fn($q) => $q->where('name', $category));
        }

        if ($minPrice = $request->get('min_price')) {
            $query->where('price', '>=', $minPrice);
        }
        if ($maxPrice = $request->get('max_price')) {
            $query->where('price', '<=', $maxPrice);
        }

        $documents = $query->paginate($request->get('per_page', 12));

        // Marquer les documents achetés si connecté
        $purchasedIds = [];
        if (Auth::check()) {
            $purchasedIds = Transaction::where('user_id', Auth::id())
                ->where('status', 'paid')
                ->pluck('document_id')
                ->toArray();
        }

        $documents->getCollection()->transform(function ($doc) use ($purchasedIds) {
            return $this->documentResponse($doc, in_array($doc->id, $purchasedIds));
        });

        return response()->json($documents);
    }

    /**
     * GET /api/documents/{id}
     * Détail d'un document
     */
    public function show(int $id): JsonResponse
    {
        $document = Document::with('category')
            ->where('is_active', true)
            ->findOrFail($id);

        $document->incrementViews();

        $isPurchased = false;
        $downloadToken = null;

        if (Auth::check()) {
            $transaction = Transaction::where('user_id', Auth::id())
                ->where('document_id', $id)
                ->where('status', 'paid')
                ->with('download')
                ->first();

            if ($transaction) {
                $isPurchased = true;
                $download = $transaction->download;
                if ($download && $download->isValid()) {
                    $downloadToken = $download->token;
                }
            }
        }

        return response()->json(array_merge(
            $this->documentResponse($document, $isPurchased),
            ['download_token' => $downloadToken]
        ));
    }

    /**
     * GET /api/categories
     */
    public function categories(): JsonResponse
    {
        $categories = Category::active()
            ->withCount(['documents' => fn($q) => $q->where('is_active', true)])
            ->get();

        return response()->json($categories);
    }

    /**
     * GET /api/my-documents
     * Documents achetés par l'utilisateur connecté
     */
    public function myDocuments(): JsonResponse
    {
        $user = Auth::user();

        $transactions = Transaction::where('user_id', $user->id)
            ->where('status', 'paid')
            ->with(['document.category', 'download'])
            ->latest()
            ->get();

        $result = $transactions->map(function ($transaction) {
            $download = $transaction->download;
            return [
                'transaction_id' => $transaction->id,
                'reference'      => $transaction->payment_reference,
                'amount'         => $transaction->amount,
                'payment_method' => $transaction->payment_method,
                'purchased_at'   => $transaction->created_at->toISOString(),
                'document'       => $transaction->document ? $this->documentResponse($transaction->document) : null,
                'download'       => $download ? [
                    'token'      => $download->token,
                    'url'        => route('download.file', $download->token),
                    'expires_at' => $download->expires_at?->toISOString(),
                    'is_valid'   => $download->isValid(),
                ] : null,
            ];
        });

        return response()->json(['data' => $result]);
    }

    private function documentResponse(Document $document, bool $isPurchased = false): array
    {
        return [
            'id'          => $document->id,
            'title'       => $document->title,
            'description' => $document->description,
            'price'       => (float) $document->price,
            'category'    => $document->category?->name ?? $document->category,
            'tags'        => $document->tags_array,
            'file_size'   => $document->file_size_formatted,
            'views'       => $document->views,
            'downloads'   => $document->downloads,
            'is_purchased'=> $isPurchased,
            'created_at'  => $document->created_at->toISOString(),
        ];
    }
}
