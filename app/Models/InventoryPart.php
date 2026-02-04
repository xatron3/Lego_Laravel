<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryPart extends Model
{
  protected $fillable = [
    'inventory_id',
    'part_num',
    'color_id',
    'quantity',
    'is_spare',
  ];

  protected $casts = [
    'inventory_id' => 'integer',
    'color_id' => 'integer',
    'quantity' => 'integer',
    'is_spare' => 'boolean',
  ];

  /**
   * Get the inventory.
   */
  public function inventory(): BelongsTo
  {
    return $this->belongsTo(Inventory::class, 'inventory_id');
  }

  /**
   * Get the part.
   */
  public function part(): BelongsTo
  {
    return $this->belongsTo(Part::class, 'part_num', 'part_num');
  }

  /**
   * Get the color.
   */
  public function color(): BelongsTo
  {
    return $this->belongsTo(Color::class, 'color_id');
  }
}
