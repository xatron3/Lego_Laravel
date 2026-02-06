<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'body',
        'visibility',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    /**
     * The user who created the post.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Images attached to this post.
     */
    public function images(): HasMany
    {
        return $this->hasMany(PostImage::class)->orderBy('sort_order');
    }

    /**
     * Likes on this post.
     */
    public function likes(): MorphMany
    {
        return $this->morphMany(Like::class, 'likeable');
    }

    /**
     * Comments on this post.
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    /**
     * Top-level comments (no parent).
     */
    public function topLevelComments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable')->whereNull('parent_id');
    }

    /**
     * Check if a user has liked this post.
     */
    public function isLikedBy(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        return $this->likes()->where('user_id', $user->id)->exists();
    }

    /**
     * Scope to get posts from users that a given user follows.
     */
    public function scopeFeed($query, ?User $user)
    {
        if (!$user) {
            // Non-authenticated users see only public posts
            return $query->where('visibility', 'public');
        }

        $followingIds = $user->following()->pluck('following_id');

        return $query->where(function ($q) use ($user, $followingIds) {
            // Own posts (all visibility)
            $q->where('user_id', $user->id)
                // Public posts from followed users
                ->orWhere(function ($q2) use ($followingIds) {
                    $q2->whereIn('user_id', $followingIds)
                        ->where('visibility', 'public');
                })
                // Followers-only posts from followed users
                ->orWhere(function ($q3) use ($followingIds) {
                    $q3->whereIn('user_id', $followingIds)
                        ->where('visibility', 'followers_only');
                });
        });
    }

    /**
     * Check if a post can be viewed by a user.
     */
    public function canBeViewedBy(?User $user): bool
    {
        // Public posts can be viewed by anyone
        if ($this->visibility === 'public') {
            return true;
        }

        // Not authenticated - can't view followers-only
        if (!$user) {
            return false;
        }

        // Author can always view their own posts
        if ($this->user_id === $user->id) {
            return true;
        }

        // Followers-only posts require following relationship
        if ($this->visibility === 'followers_only') {
            return $user->isFollowing($this->user);
        }

        return false;
    }

    /**
     * Scope to get high-engagement posts for algorithmic feed.
     * Prioritizes posts with more likes and comments from diverse users.
     */
    public function scopeHighEngagement($query, ?User $currentUser = null, array $excludeUserIds = [], int $limit = 10)
    {
        // Exclude current user's posts and already shown users
        if ($currentUser) {
            $excludeUserIds[] = $currentUser->id;
        }

        $excludeUserIdsStr = !empty($excludeUserIds) ? implode(',', $excludeUserIds) : '0';

        // Calculate engagement using subqueries directly
        $subQuery = $query->where('visibility', 'public')
            ->where('posts.created_at', '>=', now()->subDays(30))
            ->selectRaw('
        posts.*,
        (SELECT COUNT(*) FROM likes WHERE likes.likeable_id = posts.id AND likes.likeable_type = ?) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE comments.commentable_id = posts.id AND comments.commentable_type = ?) as comments_count,
        ((SELECT COUNT(*) FROM likes WHERE likes.likeable_id = posts.id AND likes.likeable_type = ?) * 2 +
         (SELECT COUNT(*) FROM comments WHERE comments.commentable_id = posts.id AND comments.commentable_type = ?) * 3) as engagement_score
      ', [Post::class, Post::class, Post::class, Post::class]);

        if (!empty($excludeUserIds)) {
            $subQuery->whereNotIn('user_id', $excludeUserIds);
        }

        // Get one post per user, ordered by engagement
        return $subQuery
            ->orderByDesc('engagement_score')
            ->orderByDesc('posts.created_at')
            ->limit($limit);
    }
}
