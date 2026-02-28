<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Download extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id', 'user_id', 'document_id',
        'token', 'downloaded_at', 'expires_at',
        'ip_address', 'user_agent',
    ];

    protected $casts = [
        'downloaded_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isValid(): bool
    {
        return !$this->isExpired();
    }

    public function getDownloadUrl(): string
    {
        return route('download.file', ['token' => $this->token]);
    }
}
