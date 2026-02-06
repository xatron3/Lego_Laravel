<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Comment extends Model
{
  protected $fillable = [
    'user_id',
    'body',
    'parent_id',
  ];

  /**
   * The user who wrote the comment.
   */
  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  /**
   * The commentable model (Post, etc.).
   */
  public function commentable(): MorphTo
  {
    return $this->morphTo();
  }

  /**
   * Parent comment (for replies).
   */
  public function parent(): BelongsTo
  {
    return $this->belongsTo(Comment::class, 'parent_id');
  }

  /**
   * Child replies to this comment.
   */
  public function replies(): HasMany
  {
    return $this->hasMany(Comment::class, 'parent_id')->orderBy('created_at');
  }

  /**
   * Likes on this comment.
   */
  public function likes(): MorphMany
  {
    return $this->morphMany(Like::class, 'likeable');
  }

  /**
   * Check if a user has liked this comment.
   */
  public function isLikedBy(?User $user): bool
  {
    if (!$user) {
      return false;
    }

    return $this->likes()->where('user_id', $user->id)->exists();
  }
}
