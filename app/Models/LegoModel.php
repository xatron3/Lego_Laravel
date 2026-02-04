<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;

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
    'is_public',
    'price',
    'thumbnail',
    'set_num',
  ];

  protected $casts = [
    'total_steps' => 'integer',
    'total_parts' => 'integer',
    'is_public' => 'boolean',
    'price' => 'decimal:2',
  ];

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  /**
   * Get inventories for this model (if it has parts breakdown).
   */
  public function inventories(): \Illuminate\Database\Eloquent\Relations\HasMany
  {
    return $this->hasMany(Inventory::class, 'set_num', 'set_num');
  }

  /**
   * Get users who own this model (purchased or claimed).
   */
  public function owners(): BelongsToMany
  {
    return $this->belongsToMany(User::class, 'user_owned_models')
      ->withPivot(['type', 'price_paid'])
      ->withTimestamps();
  }

  /**
   * Scope to get only public models.
   */
  public function scopePublic(Builder $query): Builder
  {
    return $query->where('is_public', true);
  }

  /**
   * Scope to get models visible to a user.
   */
  public function scopeVisibleTo(Builder $query, ?User $user): Builder
  {
    if (!$user) {
      return $query->public();
    }

    // Admins and mods can see all models
    if ($user->canModerate()) {
      return $query;
    }

    // Regular users can see public models and their own
    return $query->where(function ($q) use ($user) {
      $q->where('is_public', true)
        ->orWhere('user_id', $user->id);
    });
  }

  /**
   * Check if model is free.
   */
  public function isFree(): bool
  {
    return is_null($this->price) || $this->price <= 0;
  }

  /**
   * Check if a user can access this model (view details).
   */
  public function canBeAccessedBy(?User $user): bool
  {
    // Public models can be viewed by anyone
    if ($this->is_public) {
      return true;
    }

    if (!$user) {
      return false;
    }

    // Owners can always access their models
    if ($this->user_id === $user->id) {
      return true;
    }

    // Mods and admins can access all models
    if ($user->canModerate()) {
      return true;
    }

    return false;
  }

  /**
   * Check if a user can access the full LDR content of this model.
   * User must either be the creator, have claimed it, or be a moderator.
   */
  public function canAccessContent(?User $user): bool
  {
    if (!$user) {
      return false;
    }

    // Creators can always access their models
    if ($this->user_id === $user->id) {
      return true;
    }

    // Mods and admins can access all models
    if ($user->canModerate()) {
      return true;
    }

    // Check if user has purchased/claimed the model
    return $user->ownsModel($this);
  }
}
