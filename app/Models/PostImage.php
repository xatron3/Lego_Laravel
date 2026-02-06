<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PostImage extends Model
{
  protected $fillable = [
    'post_id',
    'path',
    'filename',
    'sort_order',
  ];

  protected $appends = ['url'];

  /**
   * The post this image belongs to.
   */
  public function post(): BelongsTo
  {
    return $this->belongsTo(Post::class);
  }

  /**
   * Get the public URL for this image.
   */
  public function getUrlAttribute(): string
  {
    if (str_starts_with($this->path, 'http')) {
      return $this->path;
    }

    return Storage::url($this->path);
  }
}
