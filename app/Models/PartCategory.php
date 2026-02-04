<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PartCategory extends Model
{
  protected $primaryKey = 'id';
  public $incrementing = false;
  protected $keyType = 'int';

  protected $fillable = [
    'id',
    'name',
  ];

  protected $casts = [
    'id' => 'integer',
  ];

  /**
   * Get parts in this category.
   */
  public function parts(): HasMany
  {
    return $this->hasMany(Part::class, 'part_cat_id');
  }
}
