<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
  protected $fillable = [
    'user_id',
    'moc_id',
  ];

  /**
   * Get the user who owns this cart item.
   */
  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  /**
   * Get the MOC in the cart.
   */
  public function moc(): BelongsTo
  {
    return $this->belongsTo(Moc::class);
  }

  /**
   * @deprecated Use moc() instead
   */
  public function legoModel(): BelongsTo
  {
    return $this->moc();
  }
}
