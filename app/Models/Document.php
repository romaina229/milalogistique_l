<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'description', 'file_name', 'file_path', 'file_type',
        'file_size', 'price', 'category', 'category_id', 'tags',
        'is_active', 'views', 'downloads', 'admin_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function downloads()
    {
        return $this->hasMany(Download::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function getTagsArrayAttribute(): array
    {
        if (!$this->tags) return [];
        return array_filter(array_map('trim', explode(',', $this->tags)));
    }

    public function getFileSizeFormattedAttribute(): string
    {
        if (!$this->file_size) return 'N/A';
        $size = $this->file_size;
        if ($size < 1024) return $size . ' B';
        if ($size < 1048576) return round($size / 1024, 1) . ' KB';
        return round($size / 1048576, 1) . ' MB';
    }

    public function getFileUrlAttribute(): ?string
    {
        if ($this->file_type === 'drive') {
            return $this->file_path;
        }
        if ($this->file_path) {
            return Storage::url($this->file_path);
        }
        return null;
    }

    public function incrementViews(): void
    {
        $this->increment('views');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
