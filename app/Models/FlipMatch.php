<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FlipMatch extends Model
{
    protected $fillable = [
        'buy_transaction_id',
        'sell_transaction_id',
        'buy_amount',
        'sell_amount',
        'notes',
    ];

    protected $casts = [
        'buy_amount' => 'decimal:2',
        'sell_amount' => 'decimal:2',
    ];

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    public function buyTransaction(): BelongsTo
    {
        return $this->belongsTo(FlipTransaction::class, 'buy_transaction_id');
    }

    public function sellTransaction(): BelongsTo
    {
        return $this->belongsTo(FlipTransaction::class, 'sell_transaction_id');
    }

    public function matchItems(): HasMany
    {
        return $this->hasMany(FlipMatchItem::class);
    }

    /* ------------------------------------------------------------------ */
    /*  Accessors                                                          */
    /* ------------------------------------------------------------------ */

    /** Profit for this specific match. */
    public function getProfitAttribute(): float
    {
        return (float) $this->sell_amount - (float) $this->buy_amount;
    }

    /** Profit margin percentage. */
    public function getProfitMarginAttribute(): ?float
    {
        if ((float) $this->buy_amount === 0.0) {
            return null;
        }

        return ($this->profit / (float) $this->buy_amount) * 100;
    }
}
