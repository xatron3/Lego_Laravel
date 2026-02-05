<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * MOC (My Own Creation) model.
 *
 * Contains MOC-specific data (LDR content, pricing, visibility, etc.)
 * and references the Sets table for catalog data (name, parts count, theme).
 */
class Moc extends Model
{
  use HasFactory;

  protected $table = 'mocs';

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

  /**
   * The attributes that should be hidden for serialization.
   */
  protected $hidden = [
    'ldr_content', // Hidden by default, only shown when user has access
  ];

  // ==================== Relationships ====================

  /**
   * Get the user who created this MOC.
   */
  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  /**
   * Get the related Set record (for catalog data).
   */
  public function set(): BelongsTo
  {
    return $this->belongsTo(Set::class, 'set_num', 'set_num');
  }

  /**
   * Get inventories for this MOC (parts breakdown).
   */
  public function inventories(): HasMany
  {
    return $this->hasMany(Inventory::class, 'set_num', 'set_num');
  }

  /**
   * Get images for this MOC.
   */
  public function images(): HasMany
  {
    return $this->hasMany(MocImage::class)->orderBy('sort_order');
  }

  /**
   * Get the primary image.
   */
  public function primaryImage(): BelongsTo
  {
    return $this->hasOne(MocImage::class)->where('is_primary', true);
  }

  /**
   * Get users who own this MOC (purchased or claimed).
   */
  public function owners(): BelongsToMany
  {
    return $this->belongsToMany(User::class, 'user_owned_models', 'moc_id', 'user_id')
      ->withPivot(['type', 'price_paid'])
      ->withTimestamps();
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

    // Admins and mods can see all MOCs
    if ($user->canModerate()) {
      return $query;
    }

    // Regular users can see public MOCs and their own
    return $query->where(function ($q) use ($user) {
      $q->where('is_public', true)
        ->orWhere('user_id', $user->id);
    });
  }

  // ==================== Accessors ====================

  /**
   * Get the thumbnail (from images or legacy thumbnail field).
   */
  public function getThumbnailAttribute($value): ?string
  {
    // If we have images loaded, use them
    if ($this->relationLoaded('images') && $this->images->isNotEmpty()) {
      // First try primary image
      $primaryImage = $this->images->firstWhere('is_primary', true);
      if ($primaryImage) {
        return $primaryImage->url;
      }

      // Then try first image
      return $this->images->first()?->url;
    }

    // Fallback to legacy thumbnail field
    if ($value) {
      return str_starts_with($value, '/') ? $value : '/storage/' . $value;
    }

    return null;
  }

  /**
   * Get the display thumbnail (from images or legacy thumbnail field).
   */
  public function getDisplayThumbnailAttribute(): ?string
  {
    if (!$this->thumbnail) {
      return null;
    }

    // If thumbnail already has /storage/ prefix, return as-is (legacy data)
    if (str_starts_with($this->thumbnail, '/storage/')) {
      return $this->thumbnail;
    }

    // Add /storage/ prefix to path
    return '/storage/' . $this->thumbnail;
  }

  // ==================== Helper Methods ====================

  /**
   * Check if MOC is free.
   */
  public function isFree(): bool
  {
    return is_null($this->price) || $this->price <= 0;
  }

  /**
   * Check if a user can access this MOC (view details).
   */
  public function canBeAccessedBy(?User $user): bool
  {
    // Public MOCs can be viewed by anyone
    if ($this->is_public) {
      return true;
    }

    if (!$user) {
      return false;
    }

    // Owners can always access their MOCs
    if ($this->user_id === $user->id) {
      return true;
    }

    // Mods and admins can access all MOCs
    if ($user->canModerate()) {
      return true;
    }

    return false;
  }

  /**
   * Check if a user can access the full LDR content of this MOC.
   * User must either be the creator, have claimed it, or be a moderator.
   */
  public function canAccessContent(?User $user): bool
  {
    if (!$user) {
      return false;
    }

    // Creators can always access their MOCs
    if ($this->user_id === $user->id) {
      return true;
    }

    // Mods and admins can access all MOCs
    if ($user->canModerate()) {
      return true;
    }

    // Check if user has purchased/claimed the MOC
    return $this->owners()->where('user_id', $user->id)->exists();
  }

  /**
   * Generate a unique set_num for this MOC.
   */
  public static function generateSetNum(): string
  {
    $prefix = 'MOC-';
    $maxId = static::max('id') ?? 0;
    $nextNum = $maxId + 1;

    // Ensure uniqueness
    do {
      $setNum = $prefix . str_pad($nextNum, 6, '0', STR_PAD_LEFT);
      $exists = Set::where('set_num', $setNum)->exists();
      $nextNum++;
    } while ($exists);

    return $setNum;
  }
}
