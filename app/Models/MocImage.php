<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * MOC Image model for storing multiple images per MOC.
 */
class MocImage extends Model
{
  protected $fillable = [
    'moc_id',
    'path',
    'filename',
    'sort_order',
    'is_primary',
  ];

  protected $casts = [
    'moc_id' => 'integer',
    'sort_order' => 'integer',
    'is_primary' => 'boolean',
  ];

  /**
   * The accessors to append to the model's array form.
   */
  protected $appends = ['url'];

  /**
   * Maximum number of images allowed per MOC.
   */
  public const MAX_IMAGES_PER_MOC = 8;

  /**
   * Get the MOC this image belongs to.
   */
  public function moc(): BelongsTo
  {
    return $this->belongsTo(Moc::class);
  }

  /**
   * Get the full URL for this image.
   */
  public function getUrlAttribute(): string
  {
    // Remove 'storage/' prefix if it exists (shouldn't be in path)
    $path = str_starts_with($this->path, 'storage/')
      ? substr($this->path, 8)
      : $this->path;

    return '/storage/' . $path;
  }

  /**
   * Delete the image file from storage when the model is deleted.
   */
  protected static function booted(): void
  {
    static::deleting(function (MocImage $image) {
      Storage::disk('public')->delete($image->path);
    });
  }
}
