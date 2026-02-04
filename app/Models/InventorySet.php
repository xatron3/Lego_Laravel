<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventorySet extends Model
{
  protected $fillable = [
    'inventory_id',
    'set_num',
    'quantity',
  ];

  protected $casts = [
    'inventory_id' => 'integer',
    'quantity' => 'integer',
  ];

  /**
   * Get the inventory.
   */
  public function inventory(): BelongsTo
  {
    return $this->belongsTo(Inventory::class, 'inventory_id');
  }

  /**
   * Get the set.
   */
  public function set(): BelongsTo
  {
    return $this->belongsTo(Set::class, 'set_num', 'set_num');
  }
}
