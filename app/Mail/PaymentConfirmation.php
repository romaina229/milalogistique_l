<?php

namespace App\Mail;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public string $downloadUrl;
    public string $downloadToken;

    public function __construct(
        public Transaction $transaction,
        string $downloadToken
    ) {
        $this->downloadToken = $downloadToken;
        $this->downloadUrl = route('download.file', $downloadToken);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirmation de paiement - ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment_confirmation',
            with: [
                'transaction'    => $this->transaction,
                'downloadUrl'    => $this->downloadUrl,
                'downloadToken'  => $this->downloadToken,
                'userName'       => $this->transaction->user?->name,
                'documentTitle'  => $this->transaction->document?->title,
                'amount'         => number_format($this->transaction->amount, 0, ',', ' '),
                'method'         => $this->transaction->payment_method === 'fedapay' ? 'Mobile Money (FedaPay)' : 'Carte bancaire (KKiaPay)',
                'expiresAt'      => now()->addHours(config('payment.download_expiry_hours', 72))->format('d/m/Y à H:i'),
            ]
        );
    }
}
