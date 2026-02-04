<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
  protected $fillable = [
    'user_id',
    'stripe_checkout_session_id',
    'stripe_payment_intent_id',
    'status',
    'subtotal',
    'platform_fee',
    'total',
  ];

  protected $casts = [
    'subtotal' => 'decimal:2',
    'platform_fee' => 'decimal:2',
    'total' => 'decimal:2',
  ];

  /**
   * Get the user who placed the order.
   */
  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  /**
   * Get the items in this order.
   */
  public function items(): HasMany
  {
    return $this->hasMany(OrderItem::class);
  }

  /**
   * Check if the order is completed.
   */
  public function isCompleted(): bool
  {
    return $this->status === 'completed';
  }

  /**
   * Check if the order is pending.
   */
  public function isPending(): bool
  {
    return $this->status === 'pending';
  }

  /**
   * Mark the order as completed.
   */
  public function markAsCompleted(): void
  {
    $this->update(['status' => 'completed']);
  }

  /**
   * Mark the order as failed.
   */
  public function markAsFailed(): void
  {
    $this->update(['status' => 'failed']);
  }
}
