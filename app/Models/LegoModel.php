<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LegoModel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'ldr_content',
        'file_name',
        'total_steps',
        'total_parts',
        'user_id',
    ];

    protected $casts = [
        'total_steps' => 'integer',
        'total_parts' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
