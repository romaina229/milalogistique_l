<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InitiatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'document_id'    => ['required', 'integer', 'exists:documents,id'],
            'payment_method' => ['required', 'in:fedapay,kkiapay'],
            'phone'          => ['nullable', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'document_id.required'    => 'Le document est requis.',
            'document_id.exists'      => 'Document introuvable.',
            'payment_method.required' => 'La méthode de paiement est requise.',
            'payment_method.in'       => 'Méthode de paiement invalide. Choisir : fedapay ou kkiapay.',
        ];
    }
}
