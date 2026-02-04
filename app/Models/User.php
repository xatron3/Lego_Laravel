<?php

namespace App\Models;

use App\Enums\UserRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'google_id',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    /**
     * Get the user's MOCs (created by the user).
     */
    public function mocs(): HasMany
    {
        return $this->hasMany(Moc::class);
    }

    /**
     * Get the MOCs owned by this user (purchased or claimed).
     */
    public function ownedMocs(): BelongsToMany
    {
        return $this->belongsToMany(Moc::class, 'user_owned_models', 'user_id', 'moc_id')
            ->withPivot(['type', 'price_paid'])
            ->withTimestamps();
    }

    /**
     * Check if user owns a specific MOC.
     */
    public function ownsMoc(Moc $moc): bool
    {
        // User created the MOC
        if ($moc->user_id === $this->id) {
            return true;
        }

        // User has claimed or purchased the MOC
        return $this->ownedMocs()->where('moc_id', $moc->id)->exists();
    }

    /**
     * @deprecated Use mocs() instead
     */
    public function legoModels(): HasMany
    {
        return $this->mocs();
    }

    /**
     * @deprecated Use ownedMocs() instead
     */
    public function ownedModels(): BelongsToMany
    {
        return $this->ownedMocs();
    }

    /**
     * @deprecated Use ownsMoc() instead
     */
    public function ownsModel($model): bool
    {
        if ($model instanceof Moc) {
            return $this->ownsMoc($model);
        }
        // Backward compatibility
        if ($model->user_id === $this->id) {
            return true;
        }
        return $this->ownedMocs()->where('moc_id', $model->id)->exists();
    }

    /**
     * Get the user's role enum.
     */
    public function getRole(): UserRole
    {
        return $this->role ?? UserRole::NORMAL;
    }

    /**
     * Check if user has at least the given role.
     */
    public function hasRole(UserRole $role): bool
    {
        return $this->getRole()->hasAtLeast($role);
    }

    /**
     * Check if user is a normal user.
     */
    public function isNormal(): bool
    {
        return $this->getRole() === UserRole::NORMAL;
    }

    /**
     * Check if user is at least a submitter.
     */
    public function isSubmitter(): bool
    {
        return $this->hasRole(UserRole::SUBMITTER);
    }

    /**
     * Check if user is at least a moderator.
     */
    public function isMod(): bool
    {
        return $this->hasRole(UserRole::MOD);
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole(UserRole::ADMIN);
    }

    /**
     * Check if user can submit models (submitter or higher).
     */
    public function canSubmitModels(): bool
    {
        return $this->isSubmitter();
    }

    /**
     * Check if user can moderate content (mod or higher).
     */
    public function canModerate(): bool
    {
        return $this->isMod();
    }

    /**
     * Get cart items for this user.
     */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * Get orders placed by this user.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Get seller earnings for this user.
     */
    public function sellerEarnings(): HasMany
    {
        return $this->hasMany(SellerEarning::class);
    }

    /**
     * Get total pending earnings.
     */
    public function getPendingEarnings(): float
    {
        return (float) $this->sellerEarnings()
            ->where('status', 'pending')
            ->sum('amount');
    }

    /**
     * Get total paid earnings.
     */
    public function getPaidEarnings(): float
    {
        return (float) $this->sellerEarnings()
            ->where('status', 'paid')
            ->sum('amount');
    }
}
