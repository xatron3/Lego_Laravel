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
     * Get the user's LEGO models (created by the user).
     */
    public function legoModels(): HasMany
    {
        return $this->hasMany(LegoModel::class);
    }

    /**
     * Get the models owned by this user (purchased or claimed).
     */
    public function ownedModels(): BelongsToMany
    {
        return $this->belongsToMany(LegoModel::class, 'user_owned_models')
            ->withPivot(['type', 'price_paid'])
            ->withTimestamps();
    }

    /**
     * Check if user owns a specific model.
     */
    public function ownsModel(LegoModel $model): bool
    {
        // User created the model
        if ($model->user_id === $this->id) {
            return true;
        }

        // User has claimed or purchased the model
        return $this->ownedModels()->where('lego_model_id', $model->id)->exists();
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
}
