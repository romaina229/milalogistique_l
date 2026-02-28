<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminLog extends Model
{
    protected $fillable = ['admin_id', 'action', 'details', 'ip_address', 'user_agent'];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public static function record(string $action, string $details = ''): void
    {
        static::create([
            'admin_id'   => auth()->id(),
            'action'     => $action,
            'details'    => $details,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
