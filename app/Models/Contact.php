<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $fillable = [
        'name', 'email', 'subject', 'message',
        'status', 'reply', 'replied_at',
    ];

    protected $casts = [
        'replied_at' => 'datetime',
    ];
}
