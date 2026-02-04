<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inventory extends Model
{
  protected $primaryKey = 'id';
  public $incrementing = false;
  protected $keyType = 'int';

  protected $fillable = [
    'id',
    'version',
    'set_num',
  ];

  protected $casts = [
    'id' => 'integer',
    'version' => 'integer',
  ];

  /**
   * Get the set for this inventory.
   */
  public function set(): BelongsTo
  {
    return $this->belongsTo(Set::class, 'set_num', 'set_num');
  }

  /**
   * Get inventory parts.
   */
  public function parts(): HasMany
  {
    return $this->hasMany(InventoryPart::class, 'inventory_id');
  }

  /**
   * Get inventory minifigs.
   */
  public function minifigs(): HasMany
  {
    return $this->hasMany(InventoryMinifig::class, 'inventory_id');
  }

  /**
   * Get inventory sets.
   */
  public function sets(): HasMany
  {
    return $this->hasMany(InventorySet::class, 'inventory_id');
  }
}
