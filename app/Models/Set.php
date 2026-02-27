<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;

class Set extends Model
{
    protected $primaryKey = 'set_num';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'set_num',
        'name',
        'year',
        'theme_id',
        'num_parts',
        'img_url',
        'custom_image',
    ];

    protected $casts = [
        'year' => 'integer',
        'theme_id' => 'integer',
        'num_parts' => 'integer',
    ];

    /**
     * Get the theme for this set.
     */
    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class, 'theme_id');
    }

    /**
     * Get inventories for this set.
     */
    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class, 'set_num', 'set_num');
    }

    /**
     * Get inventory sets where this set is included.
     */
    public function inventorySets(): HasMany
    {
        return $this->hasMany(InventorySet::class, 'set_num', 'set_num');
    }

    /**
     * Get the MOC associated with this set (if this is a MOC set).
     */
    public function moc(): HasOne
    {
        return $this->hasOne(Moc::class, 'set_num', 'set_num');
    }

    /**
     * Check if this set is a MOC.
     */
    public function isMoc(): bool
    {
        return str_starts_with($this->set_num, 'MOC-');
    }

    /**
     * Scope to get only official LEGO sets (not MOCs).
     */
    public function scopeOfficial(Builder $query): Builder
    {
        return $query->where('set_num', 'NOT LIKE', 'MOC-%');
    }

    /**
     * Scope to get only MOC sets.
     */
    public function scopeMocs(Builder $query): Builder
    {
        return $query->where('set_num', 'LIKE', 'MOC-%');
    }
}
