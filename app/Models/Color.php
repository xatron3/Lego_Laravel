<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Color extends Model
{
  protected $primaryKey = 'id';
  public $incrementing = false;
  protected $keyType = 'int';

  protected $fillable = [
    'id',
    'name',
    'rgb',
    'is_trans',
  ];

  protected $casts = [
    'id' => 'integer',
    'is_trans' => 'boolean',
  ];

  /**
   * Get elements with this color.
   */
  public function elements(): HasMany
  {
    return $this->hasMany(Element::class, 'color_id');
  }

  /**
   * Get inventory parts with this color.
   */
  public function inventoryParts(): HasMany
  {
    return $this->hasMany(InventoryPart::class, 'color_id');
  }

  /**
   * Get the hex color with # prefix.
   */
  public function getHexColorAttribute(): string
  {
    return '#' . $this->rgb;
  }
}
