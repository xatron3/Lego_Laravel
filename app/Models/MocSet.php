<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class MocSet extends Model
{
  protected $primaryKey = 'set_num';
  public $incrementing = false;
  protected $keyType = 'string';

  protected $fillable = [
    'set_num',
    'name',
    'description',
    'year',
    'theme_id',
    'num_parts',
    'ldr_content',
    'file_name',
    'total_steps',
    'price',
    'is_public',
    'thumbnail',
    'user_id',
  ];

  protected $casts = [
    'year' => 'integer',
    'theme_id' => 'integer',
    'num_parts' => 'integer',
    'total_steps' => 'integer',
    'is_public' => 'boolean',
    'price' => 'decimal:2',
  ];

  protected $hidden = [
    'ldr_content', // Hide by default, show only when user has access
  ];

  /**
   * Get the theme for this MOC.
   */
  public function theme(): BelongsTo
  {
    return $this->belongsTo(Theme::class, 'theme_id');
  }

  /**
   * Get the creator/owner.
   */
  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  /**
   * Get users who own this MOC (purchased or claimed).
   */
  public function owners(): BelongsToMany
  {
    return $this->belongsToMany(User::class, 'user_owned_models', 'lego_model_id', 'user_id')
      ->withPivot(['type', 'price_paid'])
      ->withTimestamps();
  }

  /**
   * Get inventories for this MOC (if it has parts breakdown).
   */
  public function inventories(): HasMany
  {
    return $this->hasMany(Inventory::class, 'set_num', 'set_num');
  }

  // ==================== Scopes ====================

  /**
   * Scope to get only public MOCs.
   */
  public function scopePublic(Builder $query): Builder
  {
    return $query->where('is_public', true);
  }

  /**
   * Scope to get MOCs visible to a user.
   */
  public function scopeVisibleTo(Builder $query, ?User $user): Builder
  {
    if (!$user) {
      return $query->public();
    }

    // Admins and mods can see all
    if ($user->canModerate()) {
      return $query;
    }

    // Regular users can see public MOCs and their own
    return $query->where(function ($q) use ($user) {
      $q->where('is_public', true)
        ->orWhere('user_id', $user->id);
    });
  }

  // ==================== Access Control ====================

  /**
   * Check if MOC is free.
   */
  public function isFree(): bool
  {
    return $this->price === null || $this->price == 0;
  }

  /**
   * Check if a user can view this MOC's details.
   */
  public function canBeAccessedBy(?User $user): bool
  {
    // Public MOCs are viewable
    if ($this->is_public) {
      return true;
    }

    // Not logged in = no access to private MOCs
    if (!$user) {
      return false;
    }

    // Admins and moderators can see everything
    if ($user->canModerate()) {
      return true;
    }

    // Creators can see their own MOCs
    if ($this->user_id === $user->id) {
      return true;
    }

    return false;
  }

  /**
   * Check if a user can access the full content (LDR file).
   */
  public function canAccessContent(?User $user): bool
  {
    // Not logged in
    if (!$user) {
      return $this->isFree() && $this->is_public;
    }

    // Admins and moderators can access everything
    if ($user->canModerate()) {
      return true;
    }

    // Creators can access their own
    if ($this->user_id === $user->id) {
      return true;
    }

    // Free public MOCs are accessible
    if ($this->isFree() && $this->is_public) {
      return true;
    }

    // Check if user owns it
    return $this->owners()->where('user_id', $user->id)->exists();
  }
}
