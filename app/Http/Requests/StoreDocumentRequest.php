<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->is_admin;
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'title'           => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'price'           => ['required', 'numeric', 'min:0'],
            'category_id'     => ['required', 'integer', 'exists:categories,id'],
            'tags'            => ['nullable', 'string'],
            'file'            => [$isUpdate ? 'nullable' : 'nullable', 'file', 'mimes:pdf', 'max:51200'],
            'google_drive_url'=> ['nullable', 'url'],
            'is_active'       => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'       => 'Le titre est requis.',
            'price.required'       => 'Le prix est requis.',
            'price.min'            => 'Le prix ne peut pas être négatif.',
            'category_id.required' => 'La catégorie est requise.',
            'category_id.exists'   => 'Catégorie introuvable.',
            'file.mimes'           => 'Le fichier doit être un PDF.',
            'file.max'             => 'Le fichier ne doit pas dépasser 50 Mo.',
            'google_drive_url.url' => 'L\'URL Google Drive est invalide.',
        ];
    }
}
