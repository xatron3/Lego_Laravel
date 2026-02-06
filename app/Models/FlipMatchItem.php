<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlipMatchItem extends Model
{
  protected $fillable = [
    'flip_match_id',
    'flip_transaction_item_id',
    'quantity',
  ];

  protected $casts = [
    'quantity' => 'integer',
  ];

  public function match(): BelongsTo
  {
    return $this->belongsTo(FlipMatch::class, 'flip_match_id');
  }

  public function transactionItem(): BelongsTo
  {
    return $this->belongsTo(FlipTransactionItem::class, 'flip_transaction_item_id');
  }
}
