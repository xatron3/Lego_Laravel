<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartRelationship extends Model
{
  protected $fillable = [
    'rel_type',
    'child_part_num',
    'parent_part_num',
  ];

  /**
   * Get the child part.
   */
  public function childPart(): BelongsTo
  {
    return $this->belongsTo(Part::class, 'child_part_num', 'part_num');
  }

  /**
   * Get the parent part.
   */
  public function parentPart(): BelongsTo
  {
    return $this->belongsTo(Part::class, 'parent_part_num', 'part_num');
  }

  /**
   * Get the relationship type label.
   */
  public function getRelTypeNameAttribute(): string
  {
    return match ($this->rel_type) {
      'A' => 'Alternate',
      'M' => 'Mold',
      'P' => 'Print',
      'R' => 'Pair',
      'T' => 'Pattern',
      default => 'Unknown',
    };
  }
}
