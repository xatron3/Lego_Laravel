<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Notification extends Model
{
  protected $fillable = [
    'user_id',
    'type',
    'actor_id',
    'notifiable_type',
    'notifiable_id',
    'data',
  ];

  protected function casts(): array
  {
    return [
      'data' => 'array',
    ];
  }

  /*
  |--------------------------------------------------------------------------
  | Notification Types
  |--------------------------------------------------------------------------
  */

  public const TYPE_NEW_FOLLOWER = 'new_follower';
  public const TYPE_POST_LIKE = 'post_like';
  public const TYPE_POST_COMMENT = 'post_comment';
  public const TYPE_MOC_SALE = 'moc_sale';

  /*
  |--------------------------------------------------------------------------
  | Relationships
  |--------------------------------------------------------------------------
  */

  /** The user who receives the notification. */
  public function user(): BelongsTo
  {
    return $this->belongsTo(User::class);
  }

  /** The user who triggered the notification. */
  public function actor(): BelongsTo
  {
    return $this->belongsTo(User::class, 'actor_id');
  }

  /** The related entity (Post, Moc, Comment, etc.). */
  public function notifiable(): MorphTo
  {
    return $this->morphTo();
  }

  /*
  |--------------------------------------------------------------------------
  | Factory Methods
  |--------------------------------------------------------------------------
  */

  /**
   * Create a "new follower" notification.
   */
  public static function notifyNewFollower(User $follower, User $followed): self
  {
    // Don't notify yourself
    if ($follower->id === $followed->id) {
      return new self();
    }

    return self::create([
      'user_id' => $followed->id,
      'type' => self::TYPE_NEW_FOLLOWER,
      'actor_id' => $follower->id,
      'data' => [
        'message' => $follower->name . ' started following you.',
      ],
    ]);
  }

  /**
   * Create a "post liked" notification.
   */
  public static function notifyPostLike(User $liker, Post $post): self
  {
    // Don't notify yourself
    if ($liker->id === $post->user_id) {
      return new self();
    }

    return self::create([
      'user_id' => $post->user_id,
      'type' => self::TYPE_POST_LIKE,
      'actor_id' => $liker->id,
      'notifiable_type' => Post::class,
      'notifiable_id' => $post->id,
      'data' => [
        'message' => $liker->name . ' liked your post.',
      ],
    ]);
  }

  /**
   * Create a "post comment" notification.
   */
  public static function notifyPostComment(User $commenter, Post $post, string $commentPreview): self
  {
    // Don't notify yourself
    if ($commenter->id === $post->user_id) {
      return new self();
    }

    return self::create([
      'user_id' => $post->user_id,
      'type' => self::TYPE_POST_COMMENT,
      'actor_id' => $commenter->id,
      'notifiable_type' => Post::class,
      'notifiable_id' => $post->id,
      'data' => [
        'message' => $commenter->name . ' commented on your post.',
        'comment_preview' => mb_substr($commentPreview, 0, 100),
      ],
    ]);
  }

  /**
   * Create a "MOC sale" notification.
   */
  public static function notifyMocSale(User $buyer, Moc $moc, string $amount): self
  {
    // Don't notify yourself
    if ($buyer->id === $moc->user_id) {
      return new self();
    }

    return self::create([
      'user_id' => $moc->user_id,
      'type' => self::TYPE_MOC_SALE,
      'actor_id' => $buyer->id,
      'notifiable_type' => Moc::class,
      'notifiable_id' => $moc->id,
      'data' => [
        'message' => $buyer->name . ' purchased your MOC "' . $moc->name . '".',
        'amount' => $amount,
      ],
    ]);
  }
}
