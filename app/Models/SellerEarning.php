<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SellerEarning extends Model
{
  protected $fillable = [
    'user_id',
    'order_item_id',
    'amount',
    'status',
    'payout_id',
    'paid_at',
  ];

  protected $casts = [
    'amount' => 'decimal:2',
    'paid_at' => 'datetime',
  ];

  /**
   * Get the seller.
   */
  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  /**
   * Get the order item this earning is from.
   */
  public function orderItem(): BelongsTo
  {
    return $this->belongsTo(OrderItem::class);
  }

  /**
   * Check if the earning is pending payout.
   */
  public function isPending(): bool
  {
    return $this->status === 'pending';
  }

  /**
   * Mark as paid.
   */
  public function markAsPaid(string $payoutId): void
  {
    $this->update([
      'status' => 'paid',
      'payout_id' => $payoutId,
      'paid_at' => now(),
    ]);
  }
}
