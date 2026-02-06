<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Minifig extends Model
{
  protected $primaryKey = 'fig_num';
  public $incrementing = false;
  protected $keyType = 'string';

  protected $fillable = [
    'fig_num',
    'name',
    'num_parts',
    'custom_image',
  ];

  protected $casts = [
    'num_parts' => 'integer',
  ];

  /**
   * Get inventory minifigs for this minifig.
   */
  public function inventoryMinifigs(): HasMany
  {
    return $this->hasMany(InventoryMinifig::class, 'fig_num', 'fig_num');
  }
}
