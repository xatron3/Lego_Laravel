<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Like extends Model
{
  protected $fillable = [
    'user_id',
  ];

  /**
   * The user who created the like.
   */
  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  /**
   * The likeable model (Post, Comment, etc.).
   */
  public function likeable(): MorphTo
  {
    return $this->morphTo();
  }
}
