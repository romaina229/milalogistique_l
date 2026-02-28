<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class AdminDocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Document::with('category')->latest();

        if ($search = $request->get('search')) {
            $query->where('title', 'like', "%{$search}%");
        }
        if ($status = $request->get('status')) {
            $query->where('is_active', $status === 'active');
        }

        return response()->json($query->paginate(20));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'category_id' => 'nullable|exists:categories,id',
            'category'    => 'nullable|string|max:100',
            'tags'        => 'nullable|string',
            'file_type'   => 'required|in:upload,drive',
            'file_url'    => 'required_if:file_type,drive|nullable|url',
            'file'        => 'required_if:file_type,upload|nullable|file|mimes:pdf|max:20480',
        ]);

        $data = $request->only(['title', 'description', 'price', 'category_id', 'category', 'tags']);
        $data['is_active'] = true;
        $data['admin_id']  = auth()->id();
        $data['file_type'] = $request->file_type;

        if ($request->file_type === 'drive') {
            $data['file_path'] = $request->file_url;
            $data['file_name'] = $request->title . '.pdf';
        } elseif ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store('documents', 'local');
            $data['file_path'] = $path;
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_size'] = $file->getSize();
        }

        $document = Document::create($data);

        return response()->json(['document' => $document, 'message' => 'Document créé avec succès.'], 201);
    }

    public function update(Request $request, Document $document): JsonResponse
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'price'       => 'required|numeric|min:0',
            'category_id' => 'nullable|exists:categories,id',
            'tags'        => 'nullable|string',
            'is_active'   => 'boolean',
        ]);

        $data = $request->only(['title', 'description', 'price', 'category_id', 'category', 'tags', 'is_active']);

        if ($request->file_type === 'drive' && $request->file_url) {
            $data['file_path'] = $request->file_url;
            $data['file_type'] = 'drive';
        } elseif ($request->hasFile('file')) {
            if ($document->file_path && $document->file_type === 'upload') {
                Storage::delete($document->file_path);
            }
            $file = $request->file('file');
            $data['file_path'] = $file->store('documents', 'local');
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_size'] = $file->getSize();
            $data['file_type'] = 'upload';
        }

        $document->update($data);
        return response()->json(['document' => $document, 'message' => 'Document mis à jour.']);
    }

    public function destroy(Document $document): JsonResponse
    {
        if ($document->file_type === 'upload' && $document->file_path) {
            Storage::delete($document->file_path);
        }
        $document->delete();
        return response()->json(['message' => 'Document supprimé.']);
    }

    public function toggle(Document $document): JsonResponse
    {
        $document->update(['is_active' => !$document->is_active]);
        return response()->json(['is_active' => $document->is_active]);
    }

    public function dashboard(): JsonResponse
    {
        $stats = [
            'total_documents'    => Document::count(),
            'active_documents'   => Document::where('is_active', true)->count(),
            'total_users'        => User::where('is_admin', false)->count(),
            'total_transactions' => Transaction::count(),
            'paid_transactions'  => Transaction::where('status', 'paid')->count(),
            'total_revenue'      => Transaction::where('status', 'paid')->sum('amount'),
            'today_revenue'      => Transaction::where('status', 'paid')
                ->whereDate('created_at', today())->sum('amount'),
            'monthly_revenue'    => Transaction::where('status', 'paid')
                ->whereMonth('created_at', now()->month)->sum('amount'),
        ];

        $recentTransactions = Transaction::with(['user', 'document'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'id'        => $t->id,
                'reference' => $t->payment_reference,
                'amount'    => $t->amount,
                'status'    => $t->status,
                'method'    => $t->payment_method,
                'user'      => $t->user?->name,
                'document'  => $t->document?->title,
                'date'      => $t->created_at->toISOString(),
            ]);

        $topDocuments = Document::with('category')
            ->orderBy('downloads', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'stats'               => $stats,
            'recent_transactions' => $recentTransactions,
            'top_documents'       => $topDocuments,
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $query = Transaction::with(['user', 'document'])->latest();

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        if ($method = $request->get('method')) {
            $query->where('payment_method', $method);
        }
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('payment_reference', 'like', "%{$search}%")
                  ->orWhereHas('user', fn($uq) => $uq->where('email', 'like', "%{$search}%"));
            });
        }

        $transactions = $query->paginate(20)->through(fn($t) => [
            'id'        => $t->id,
            'reference' => $t->payment_reference,
            'amount'    => $t->amount,
            'status'    => $t->status,
            'method'    => $t->payment_method,
            'user'      => ['name' => $t->user?->name, 'email' => $t->user?->email],
            'document'  => ['title' => $t->document?->title],
            'date'      => $t->created_at->toISOString(),
        ]);

        return response()->json($transactions);
    }

    public function users(Request $request): JsonResponse
    {
        $query = User::where('is_admin', false)->latest();

        if ($search = $request->get('search')) {
            $query->where(fn($q) => $q->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%"));
        }

        return response()->json($query->withCount('transactions')->paginate(20));
    }
}
