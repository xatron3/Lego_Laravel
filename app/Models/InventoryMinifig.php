<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMinifig extends Model
{
  protected $fillable = [
    'inventory_id',
    'fig_num',
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
   * Get the minifig.
   */
  public function minifig(): BelongsTo
  {
    return $this->belongsTo(Minifig::class, 'fig_num', 'fig_num');
  }
}
