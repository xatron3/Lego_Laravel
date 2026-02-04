<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Element extends Model
{
  protected $primaryKey = 'element_id';
  public $incrementing = false;
  protected $keyType = 'string';

  protected $fillable = [
    'element_id',
    'part_num',
    'color_id',
  ];

  protected $casts = [
    'color_id' => 'integer',
  ];

  /**
   * Get the part for this element.
   */
  public function part(): BelongsTo
  {
    return $this->belongsTo(Part::class, 'part_num', 'part_num');
  }

  /**
   * Get the color for this element.
   */
  public function color(): BelongsTo
  {
    return $this->belongsTo(Color::class, 'color_id');
  }
}
