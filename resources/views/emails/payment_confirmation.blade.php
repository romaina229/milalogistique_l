@extends('layouts.email')

@section('title', 'Confirmation de paiement — Mila Logistique')

@section('content')
<h2>✅ Paiement confirmé !</h2>

<p>Bonjour <strong>{{ $transaction->user->name }}</strong>,</p>
<p>
    Votre paiement a été <strong style="color:#16a34a;">confirmé avec succès</strong>.
    Voici le récapitulatif de votre commande&nbsp;:
</p>

<div class="info-box">
    <div class="info-row">
        <span class="info-label">📄 Document</span>
        <span class="info-value">{{ $transaction->document->title }}</span>
    </div>
    <div class="info-row">
        <span class="info-label">💰 Montant payé</span>
        <span class="info-value">{{ number_format($transaction->amount, 0, ',', ' ') }} FCFA</span>
    </div>
    <div class="info-row">
        <span class="info-label">📱 Méthode</span>
        <span class="info-value">{{ $transaction->payment_method === 'fedapay' ? 'FedaPay (Mobile Money)' : 'KKiaPay (Carte)' }}</span>
    </div>
    <div class="info-row">
        <span class="info-label">🔑 Référence</span>
        <span class="info-value" style="font-family:monospace;font-size:13px;">{{ $transaction->reference }}</span>
    </div>
    <div class="info-row">
        <span class="info-label">🕐 Date</span>
        <span class="info-value">{{ $transaction->paid_at->format('d/m/Y à H:i') }}</span>
    </div>
    @if($download)
    <div class="info-row">
        <span class="info-label">⏳ Lien valide jusqu'au</span>
        <span class="info-value">{{ $download->expires_at->format('d/m/Y à H:i') }}</span>
    </div>
    @endif
</div>

@if($download && $download->is_valid)
<p style="text-align:center;margin:24px 0;">
    <a href="{{ url('/download/' . $download->token) }}" class="btn">📥 Télécharger mon document</a>
</p>
<p style="font-size:13px;color:#6b7280;text-align:center;">
    Ce lien est valide pendant <strong>72 heures</strong>.<br>
    Vous pouvez aussi retrouver vos documents dans
    <a href="{{ config('app.url') }}/my-documents" style="color:#1d4ed8;">votre espace personnel</a>.
</p>
@endif

<p>Merci de votre confiance !</p>
<p style="margin-top:20px;">L'équipe <strong>Mila Logistique</strong></p>
@endsection
