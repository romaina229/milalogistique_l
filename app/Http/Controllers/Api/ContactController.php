<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ContactController extends Controller
{
    /**
     * POST /api/contact — Envoyer un message (public)
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|min:10',
        ]);

        $contact = Contact::create($request->only(['name', 'email', 'subject', 'message']));

        return response()->json([
            'success' => true,
            'message' => 'Votre message a été envoyé. Nous vous répondrons dans les plus brefs délais.',
        ], 201);
    }

    /**
     * GET /api/my-messages — Messages du client connecté
     */
    public function myMessages(Request $request): JsonResponse
    {
        $contacts = Contact::where('email', $request->user()->email)
            ->latest()
            ->get();

        return response()->json(['data' => $contacts]);
    }

    /**
     * GET /api/admin/contacts — Liste (admin)
     */
    public function index(Request $request): JsonResponse
    {
        $contacts = Contact::query()
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->search, fn($q) => $q->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%")
                  ->orWhere('subject', 'like', "%{$request->search}%");
            }))
            ->latest()
            ->paginate(20);

        return response()->json($contacts);
    }

    /**
     * GET /api/admin/contacts/{contact} — Détail + marquer lu (admin)
     */
    public function show(Contact $contact): JsonResponse
    {
        if ($contact->status === 'unread') {
            $contact->update(['status' => 'read']);
        }

        return response()->json($contact);
    }

    /**
     * POST /api/admin/contacts/{contact}/reply — Répondre (admin)
     */
    public function reply(Request $request, Contact $contact): JsonResponse
    {
        $request->validate([
            'reply' => 'required|string|min:5',
        ]);

        $contact->update([
            'reply'      => $request->reply,
            'status'     => 'replied',
            'replied_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Réponse enregistrée',
            'contact' => $contact->fresh(),
        ]);
    }

    /**
     * PATCH /api/admin/contacts/{contact}/status — Changer statut (admin)
     */
    public function updateStatus(Request $request, Contact $contact): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:unread,read,replied,archived',
        ]);

        $contact->update(['status' => $request->status]);

        return response()->json(['success' => true, 'contact' => $contact]);
    }

    /**
     * DELETE /api/admin/contacts/{contact} — Supprimer (admin)
     */
    public function destroy(Contact $contact): JsonResponse
    {
        $contact->delete();
        return response()->json(['success' => true, 'message' => 'Message supprimé']);
    }
}