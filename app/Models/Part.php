<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Part extends Model
{
  protected $primaryKey = 'part_num';
  public $incrementing = false;
  protected $keyType = 'string';

  protected $fillable = [
    'part_num',
    'name',
    'part_cat_id',
  ];

  protected $casts = [
    'part_cat_id' => 'integer',
  ];

  /**
   * Get the part category.
   */
  public function category(): BelongsTo
  {
    return $this->belongsTo(PartCategory::class, 'part_cat_id');
  }

  /**
   * Get elements for this part.
   */
  public function elements(): HasMany
  {
    return $this->hasMany(Element::class, 'part_num', 'part_num');
  }

  /**
   * Get inventory parts for this part.
   */
  public function inventoryParts(): HasMany
  {
    return $this->hasMany(InventoryPart::class, 'part_num', 'part_num');
  }

  /**
   * Get child part relationships.
   */
  public function childRelationships(): HasMany
  {
    return $this->hasMany(PartRelationship::class, 'parent_part_num', 'part_num');
  }

  /**
   * Get parent part relationships.
   */
  public function parentRelationships(): HasMany
  {
    return $this->hasMany(PartRelationship::class, 'child_part_num', 'part_num');
  }
}
