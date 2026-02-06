<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Theme extends Model
{
  protected $primaryKey = 'id';
  public $incrementing = false;
  protected $keyType = 'int';

  protected $fillable = [
    'id',
    'name',
    'parent_id',
    'custom_image',
  ];

  protected $casts = [
    'id' => 'integer',
    'parent_id' => 'integer',
  ];

  /**
   * Get the parent theme.
   */
  public function parent(): BelongsTo
  {
    return $this->belongsTo(Theme::class, 'parent_id');
  }

  /**
   * Get child themes.
   */
  public function children(): HasMany
  {
    return $this->hasMany(Theme::class, 'parent_id');
  }

  /**
   * Get sets in this theme.
   */
  public function sets(): HasMany
  {
    return $this->hasMany(Set::class, 'theme_id');
  }
}
