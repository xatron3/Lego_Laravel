<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class OrderItem extends Model
{
  protected $fillable = [
    'order_id',
    'moc_id',
    'seller_id',
    'price',
    'seller_amount',
    'platform_amount',
  ];

  protected $casts = [
    'price' => 'decimal:2',
    'seller_amount' => 'decimal:2',
    'platform_amount' => 'decimal:2',
  ];

  /**
   * Get the order this item belongs to.
   */
  public function order(): BelongsTo
  {
    return $this->belongsTo(Order::class);
  }

  /**
   * Get the MOC being purchased.
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

  /**
   * Get the seller of this item.
   */
  public function seller(): BelongsTo
  {
    return $this->belongsTo(User::class, 'seller_id');
  }

  /**
   * Get the seller earning record for this item.
   */
  public function sellerEarning(): HasOne
  {
    return $this->hasOne(SellerEarning::class);
  }
}
