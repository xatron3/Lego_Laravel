<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class FlipTransaction extends Model
{
  protected $fillable = [
    'user_id',
    'parent_id',
    'type',
    'title',
    'price',
    'notes',
    'platform',
    'transaction_date',
    'shipping_cost',
    'fees',
    'status',
  ];

  protected $casts = [
    'price' => 'decimal:2',
    'shipping_cost' => 'decimal:2',
    'fees' => 'decimal:2',
    'transaction_date' => 'date',
  ];

  /* ------------------------------------------------------------------ */
  /*  Relationships                                                      */
  /* ------------------------------------------------------------------ */

  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  /** Parent transaction (for sub-sells attached to a buy). */
  public function parent(): BelongsTo
  {
    return $this->belongsTo(FlipTransaction::class, 'parent_id');
  }

  /** Sub-transactions (sells) attached to this buy. */
  public function subTransactions(): HasMany
  {
    return $this->hasMany(FlipTransaction::class, 'parent_id');
  }

  public function items(): HasMany
  {
    return $this->hasMany(FlipTransactionItem::class);
  }

  /** Activity notes on this transaction. */
  public function transactionNotes(): HasMany
  {
    return $this->hasMany(FlipTransactionNote::class)->orderByDesc('created_at');
  }

  /** Matches where this transaction is the buy side. */
  public function buyMatches(): HasMany
  {
    return $this->hasMany(FlipMatch::class, 'buy_transaction_id');
  }

  /** Matches where this transaction is the sell side. */
  public function sellMatches(): HasMany
  {
    return $this->hasMany(FlipMatch::class, 'sell_transaction_id');
  }

  /** All matches this transaction participates in (either side). */
  public function matches(): HasMany
  {
    return $this->type === 'buy'
      ? $this->buyMatches()
      : $this->sellMatches();
  }

    /* ------------------------------------------------------------------ */
    /*  Computed attributes                                                */
    /* ------------------------------------------------------------------ */

  /** Total cost including shipping & fees. */
  public function getTotalCostAttribute(): float
  {
    return (float) $this->price + (float) $this->shipping_cost + (float) $this->fees;
  }

  /** Amount already matched. */
  public function getMatchedAmountAttribute(): float
  {
    if ($this->type === 'buy') {
      return (float) $this->buyMatches()->sum('buy_amount');
    }

    return (float) $this->sellMatches()->sum('sell_amount');
  }

  /** Amount still unmatched. */
  public function getUnmatchedAmountAttribute(): float
  {
    return max(0, (float) $this->price - $this->matched_amount);
  }

  /** Total sell revenue matched against this buy. */
  public function getMatchedSellTotalAttribute(): float
  {
    if ($this->type !== 'buy') {
      return 0;
    }

    return (float) $this->buyMatches()->sum('sell_amount');
  }

  /** Profit/loss for fully or partially matched buys. */
  public function getProfitAttribute(): ?float
  {
    if ($this->type !== 'buy') {
      return null;
    }

    $sellTotal = (float) $this->buyMatches()->sum('sell_amount');
    $buyMatched = (float) $this->buyMatches()->sum('buy_amount');

    if ($buyMatched === 0.0) {
      return null;
    }

    // Pro-rate fees/shipping for matched portion
    $matchRatio = $buyMatched / max((float) $this->price, 0.01);
    $allocatedCosts = ($this->shipping_cost + $this->fees) * $matchRatio;

    return $sellTotal - $buyMatched - $allocatedCosts;
  }

  /* ------------------------------------------------------------------ */
  /*  Sub-transaction computed attributes                                */
  /* ------------------------------------------------------------------ */

  /** Total revenue from sub-transactions (sells attached to this buy). */
  public function getSubSellTotalAttribute(): float
  {
    if ($this->type !== 'buy') {
      return 0;
    }

    return (float) $this->subTransactions()->sum('price');
  }

  /** Total shipping cost from sub-transactions. */
  public function getSubShippingTotalAttribute(): float
  {
    if ($this->type !== 'buy') {
      return 0;
    }

    return (float) $this->subTransactions()->sum('shipping_cost');
  }

  /** Total fees from sub-transactions. */
  public function getSubFeesTotalAttribute(): float
  {
    if ($this->type !== 'buy') {
      return 0;
    }

    return (float) $this->subTransactions()->sum('fees');
  }

  /** Net profit from sub-transactions: sell revenue - buy cost - sub fees/shipping. */
  public function getSubProfitAttribute(): ?float
  {
    if ($this->type !== 'buy') {
      return null;
    }

    $sellTotal = $this->sub_sell_total;
    if ($sellTotal <= 0) {
      return null;
    }

    $subFees = $this->sub_fees_total;
    $subShipping = $this->sub_shipping_total;

    return $sellTotal - $this->total_cost - $subFees - $subShipping;
  }

  /** Check if this buy has only trackable items (sets/minifigs, no custom). */
  public function getHasOnlyTrackableItemsAttribute(): bool
  {
    if ($this->type !== 'buy') {
      return false;
    }

    $items = $this->items;
    if ($items->isEmpty()) {
      return false;
    }

    return $items->every(fn($item) => in_array($item->item_type, ['set', 'minifig']));
  }

  /** Check if this buy has any custom items.  */
  public function getHasCustomItemsAttribute(): bool
  {
    return $this->items->contains(fn($item) => $item->item_type === 'custom');
  }

  /* ------------------------------------------------------------------ */
  /*  Scopes                                                             */
  /* ------------------------------------------------------------------ */

  public function scopeForUser(Builder $query, int $userId): Builder
  {
    return $query->where('user_id', $userId);
  }

  public function scopeBuys(Builder $query): Builder
  {
    return $query->where('type', 'buy');
  }

  public function scopeSells(Builder $query): Builder
  {
    return $query->where('type', 'sell');
  }

  public function scopeOpen(Builder $query): Builder
  {
    return $query->where('status', 'open');
  }

  public function scopePartial(Builder $query): Builder
  {
    return $query->where('status', 'partial');
  }

  public function scopeComplete(Builder $query): Builder
  {
    return $query->where('status', 'complete');
  }

  /** Only parent transactions (no parent_id). */
  public function scopeParents(Builder $query): Builder
  {
    return $query->whereNull('parent_id');
  }

  /** Only sub-transactions (has parent_id). */
  public function scopeChildren(Builder $query): Builder
  {
    return $query->whereNotNull('parent_id');
  }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */

  /**
   * Recalculate status based on sub-transactions.
   * - If has sub-sells → partial
   * - If no sub-sells → open
   * - Auto-complete only if buy has only sets/minifigs and all quantities are sold
   * - Manual complete is still respected
   */
  public function recalculateStatus(): void
  {
    // If manually completed, leave it alone
    if ($this->status === 'complete') {
      return;
    }

    // For parent buys, check sub-transactions
    if ($this->type === 'buy' && is_null($this->parent_id)) {
      $hasSubSells = $this->subTransactions()->exists();

      if (!$hasSubSells) {
        $this->status = 'open';
      } else {
        // Check for auto-complete: only if tracking items (sets/minifigs only)
        if ($this->has_only_trackable_items && $this->allItemsFullySold()) {
          $this->status = 'complete';
        } else {
          $this->status = 'partial';
        }
      }
    } else {
      // For sells or sub-transactions, use old matching logic
      $matched = $this->matched_amount;
      $this->status = $matched > 0 ? 'partial' : 'open';
    }

    $this->saveQuietly();
  }

  /**
   * Check if all items in this buy have been fully sold via sub-transactions.
   * Only makes sense for trackable items (sets/minifigs).
   */
  public function allItemsFullySold(): bool
  {
    if ($this->type !== 'buy') {
      return false;
    }

    $buyItems = $this->items;
    if ($buyItems->isEmpty()) {
      return false;
    }

    // Get all items from sub-sells
    $subSellItems = collect();
    foreach ($this->subTransactions as $subSell) {
      $subSellItems = $subSellItems->merge($subSell->items);
    }

    // Check each buy item has been fully sold
    foreach ($buyItems as $buyItem) {
      if ($buyItem->item_type === 'custom') {
        // Custom items can't be auto-tracked
        return false;
      }

      $soldQty = $subSellItems
        ->filter(function ($sellItem) use ($buyItem) {
          if ($buyItem->item_type === 'set') {
            return $sellItem->item_type === 'set' && $sellItem->set_num === $buyItem->set_num;
          } elseif ($buyItem->item_type === 'minifig') {
            return $sellItem->item_type === 'minifig' && $sellItem->fig_num === $buyItem->fig_num;
          }
          return false;
        })
        ->sum('quantity');

      if ($soldQty < $buyItem->quantity) {
        return false;
      }
    }

    return true;
  }

  /** Manually mark this transaction as complete. */
  public function markComplete(): void
  {
    $this->status = 'complete';
    $this->saveQuietly();
  }

  /** Re-open a completed transaction. */
  public function reopen(): void
  {
    // Check if should be partial or open
    if ($this->type === 'buy' && is_null($this->parent_id)) {
      $hasSubSells = $this->subTransactions()->exists();
      $this->status = $hasSubSells ? 'partial' : 'open';
    } else {
      $matched = $this->matched_amount;
      $this->status = $matched > 0 ? 'partial' : 'open';
    }
    $this->saveQuietly();
  }

  /** Check if this transaction belongs to the given user. */
  public function belongsToUser(?User $user): bool
  {
    return $user && $this->user_id === $user->id;
  }
}
