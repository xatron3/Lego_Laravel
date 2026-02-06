<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FlipTransactionNote extends Model
{
  protected $fillable = [
    'flip_transaction_id',
    'content',
  ];

  public function transaction(): BelongsTo
  {
    return $this->belongsTo(FlipTransaction::class, 'flip_transaction_id');
  }
}
