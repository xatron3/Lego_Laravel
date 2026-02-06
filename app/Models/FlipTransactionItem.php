<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlipTransactionItem extends Model
{
  protected $fillable = [
    'flip_transaction_id',
    'item_type',
    'set_num',
    'fig_num',
    'custom_description',
    'quantity',
    'estimated_value',
    'condition',
  ];

  protected $casts = [
    'quantity' => 'integer',
    'estimated_value' => 'decimal:2',
  ];

  /* ------------------------------------------------------------------ */
  /*  Relationships                                                      */
  /* ------------------------------------------------------------------ */

  public function transaction(): BelongsTo
  {
    return $this->belongsTo(FlipTransaction::class, 'flip_transaction_id');
  }

  /** If linked to a LEGO set. */
  public function set(): BelongsTo
  {
    return $this->belongsTo(Set::class, 'set_num', 'set_num');
  }

  /** If linked to a minifig. */
  public function minifig(): BelongsTo
  {
    return $this->belongsTo(Minifig::class, 'fig_num', 'fig_num');
  }

    /* ------------------------------------------------------------------ */
    /*  Accessors                                                          */
    /* ------------------------------------------------------------------ */

  /** Human-readable label for this item. */
  public function getLabelAttribute(): string
  {
    return match ($this->item_type) {
      'set' => $this->set?->name ?? $this->set_num ?? 'Unknown Set',
      'minifig' => $this->minifig?->name ?? $this->fig_num ?? 'Unknown Minifig',
      'custom' => $this->custom_description ?? 'Custom Item',
      default => 'Unknown Item',
    };
  }

  /** Identifier string for display. */
  public function getIdentifierAttribute(): string
  {
    return match ($this->item_type) {
      'set' => $this->set_num ?? '',
      'minifig' => $this->fig_num ?? '',
      'custom' => '',
      default => '',
    };
  }
}
