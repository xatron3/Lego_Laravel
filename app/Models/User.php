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
    'username',
    'email',
    'password',
    'role',
    'google_id',
    'avatar',
    'bio',
    'settings',
    'is_pro',
    'pro_expires_at',
    'stripe_customer_id',
    'stripe_subscription_id',
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
      'settings' => 'array',
      'is_pro' => 'boolean',
      'pro_expires_at' => 'datetime',
    ];
  }

  /**
   * Get a specific setting value with optional default.
   */
  public function getSetting(string $key, mixed $default = null): mixed
  {
    return data_get($this->settings, $key, $default);
  }

  /**
   * Set a specific setting value.
   */
  public function setSetting(string $key, mixed $value): void
  {
    $settings = $this->settings ?? [];
    data_set($settings, $key, $value);
    $this->settings = $settings;
  }

  /**
   * Get flipping settings with defaults.
   */
  public function getFlippingSettings(): array
  {
    $defaults = [
      'currency_symbol' => '$',
      'currency_placement' => 'left',
    ];

    return array_merge($defaults, $this->getSetting('flipping', []));
  }

  /**
   * Check if user has an active Pro subscription.
   */
  public function isPro(): bool
  {
    if (!$this->is_pro) {
      return false;
    }

    // If there's an expiry date, check it
    if ($this->pro_expires_at && $this->pro_expires_at->isPast()) {
      return false;
    }

    return true;
  }

  /**
   * Check if user has reached the free flip transaction limit.
   */
  public function hasReachedFlipLimit(): bool
  {
    if ($this->isPro()) {
      return false;
    }

    $limit = SiteSetting::getValue('free_flip_transaction_limit', 100);
    return $this->flipTransactions()->parents()->count() >= $limit;
  }

  /**
   * Get remaining flip transactions for free users.
   */
  public function remainingFlipTransactions(): ?int
  {
    if ($this->isPro()) {
      return null; // unlimited
    }

    $limit = SiteSetting::getValue('free_flip_transaction_limit', 100);
    $used = $this->flipTransactions()->parents()->count();
    return max(0, $limit - $used);
  }

  /**
   * Check if user can access 3D viewer for a specific MOC.
   */
  public function canAccessViewer(Moc $moc): bool
  {
    // Pro users can always access the viewer
    if ($this->isPro()) {
      return true;
    }

    // Creator always has access
    if ($moc->user_id === $this->id) {
      return true;
    }

    // Owners (purchased/claimed) have access
    if ($this->ownsMoc($moc)) {
      return true;
    }

    // Paid MOCs require purchase or Pro
    if (!$moc->isFree()) {
      return false;
    }

    // Free MOCs: non-pro users cannot use the 3D viewer
    return false;
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
   * Get flip transactions for this user.
   */
  public function flipTransactions(): HasMany
  {
    return $this->hasMany(FlipTransaction::class);
  }

  /**
   * Users that this user follows.
   */
  public function following(): HasMany
  {
    return $this->hasMany(Follow::class, 'follower_id');
  }

  /**
   * Users that follow this user.
   */
  public function followers(): HasMany
  {
    return $this->hasMany(Follow::class, 'following_id');
  }

  /**
   * Get users this user follows (User models).
   */
  public function followingUsers(): BelongsToMany
  {
    return $this->belongsToMany(User::class, 'follows', 'follower_id', 'following_id')
      ->withTimestamps();
  }

  /**
   * Get users who follow this user (User models).
   */
  public function followerUsers(): BelongsToMany
  {
    return $this->belongsToMany(User::class, 'follows', 'following_id', 'follower_id')
      ->withTimestamps();
  }

  /**
   * Check if this user follows a given user.
   */
  public function isFollowing(User $user): bool
  {
    return $this->following()->where('following_id', $user->id)->exists();
  }

  /**
   * Check if a given user follows this user.
   */
  public function isFollowedBy(User $user): bool
  {
    return $this->followers()->where('follower_id', $user->id)->exists();
  }

  /**
   * Follow a user.
   */
  public function follow(User $user): void
  {
    if ($user->id === $this->id) {
      return;
    }

    $this->following()->firstOrCreate(['following_id' => $user->id]);
  }

  /**
   * Unfollow a user.
   */
  public function unfollow(User $user): void
  {
    $this->following()->where('following_id', $user->id)->delete();
  }

  /**
   * Get the user's posts.
   */
  public function posts(): HasMany
  {
    return $this->hasMany(Post::class);
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
