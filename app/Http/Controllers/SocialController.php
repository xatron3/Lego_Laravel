<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Handles Inertia page rendering for social features (profiles, feed).
 */
class SocialController extends Controller
{
    /**
     * Show the feed page with algorithmic mixing.
     */
    public function feed(Request $request): Response
    {
        $user = $request->user();

        if (!$user) {
            // Non-authenticated users see top 10+ high-engagement posts
            $posts = Post::highEngagement(null, [], 15)
                ->with([
                    'user:id,name,username,avatar',
                    'images',
                ])
                ->get();

            // If we don't have enough posts, fill with any public posts
            if ($posts->count() < 10) {
                $excludeIds = $posts->pluck('id')->toArray();
                $additionalPosts = Post::where('visibility', 'public')
                    ->whereNotIn('id', $excludeIds)
                    ->with([
                        'user:id,name,username,avatar',
                        'images',
                    ])
                    ->withCount(['likes', 'comments'])
                    ->orderByDesc('created_at')
                    ->limit(10 - $posts->count())
                    ->get();

                $posts = $posts->merge($additionalPosts);
            }

            // Convert to paginated response
            $perPage = 15;
            $currentPage = $request->input('page', 1);
            $paginatedPosts = new \Illuminate\Pagination\LengthAwarePaginator(
                $posts->forPage($currentPage, $perPage),
                $posts->count(),
                $perPage,
                $currentPage,
                ['path' => $request->url()]
            );

            $paginatedPosts->getCollection()->transform(function ($post) {
                $post->is_liked = false;
                $post->is_following = false;
                $post->is_from_feed = false;
                return $post;
            });

            return Inertia::render('Community/Feed', [
                'initialPosts' => $paginatedPosts,
            ]);
        }

        // Authenticated users: mix followed posts with algorithmic recommendations
        $followingIds = $user->following()->pluck('following_id')->toArray();

        // Get posts from followed users
        $followedPosts = Post::feed($user)
            ->with([
                'user:id,name,username,avatar',
                'images',
            ])
            ->withCount(['likes', 'comments'])
            ->orderByDesc('created_at')
            ->limit(30) // Get more to mix with
            ->get();

        // Calculate how many algorithmic posts we need
        $totalNeeded = max(10, $followedPosts->count());
        $algorithmicNeeded = max(0, $totalNeeded - $followedPosts->count());

        // Get user IDs already in followed posts to ensure diversity
        $excludeUserIds = array_merge(
            $followedPosts->pluck('user_id')->unique()->toArray(),
            [$user->id]
        );

        // Get high-engagement posts from users not in the feed yet
        $algorithmicPosts = Post::highEngagement($user, $excludeUserIds, $algorithmicNeeded + 5)
            ->with([
                'user:id,name,username,avatar',
                'images',
            ])
            ->get();

        // Mix posts: insert algorithmic post every 3 followed posts
        $mixed = collect();
        $followedIndex = 0;
        $algorithmicIndex = 0;
        $postsSinceLastAlgorithmic = 0;

        while ($followedIndex < $followedPosts->count() || $algorithmicIndex < $algorithmicPosts->count()) {
            // Add followed posts (up to 3)
            while ($postsSinceLastAlgorithmic < 3 && $followedIndex < $followedPosts->count()) {
                $mixed->push($followedPosts[$followedIndex]);
                $followedIndex++;
                $postsSinceLastAlgorithmic++;
            }

            // Insert algorithmic post after every 3 followed posts
            if ($postsSinceLastAlgorithmic >= 3 && $algorithmicIndex < $algorithmicPosts->count()) {
                $mixed->push($algorithmicPosts[$algorithmicIndex]);
                $algorithmicIndex++;
                $postsSinceLastAlgorithmic = 0;
            }

            // If we've run out of followed posts, add remaining algorithmic
            if ($followedIndex >= $followedPosts->count() && $algorithmicIndex < $algorithmicPosts->count()) {
                $mixed->push($algorithmicPosts[$algorithmicIndex]);
                $algorithmicIndex++;
            }
        }

        // Ensure we have at least 10 posts
        if ($mixed->count() < 10) {
            $excludePostIds = $mixed->pluck('id')->toArray();
            $excludeUserIds = array_merge(
                $mixed->pluck('user_id')->unique()->toArray(),
                [$user->id]
            );

            // Fill with any public posts from users not yet shown
            $fillPosts = Post::where('visibility', 'public')
                ->whereNotIn('id', $excludePostIds)
                ->whereNotIn('user_id', $excludeUserIds)
                ->with([
                    'user:id,name,username,avatar',
                    'images',
                ])
                ->withCount(['likes', 'comments'])
                ->orderByDesc('created_at')
                ->limit(10 - $mixed->count())
                ->get();

            $mixed = $mixed->merge($fillPosts);
        }

        $mixed = $mixed->take(15); // Limit to 15 for pagination

        // Add is_liked and is_following flags
        $likedPostIds = DB::table('likes')
            ->where('user_id', $user->id)
            ->where('likeable_type', Post::class)
            ->whereIn('likeable_id', $mixed->pluck('id'))
            ->pluck('likeable_id')
            ->toArray();

        $mixed->transform(function ($post) use ($likedPostIds, $followingIds, $user) {
            $post->is_liked = in_array($post->id, $likedPostIds);
            $post->is_following = in_array($post->user_id, $followingIds);
            $post->is_from_feed = $post->user_id === $user->id || in_array($post->user_id, $followingIds);
            return $post;
        });

        // Paginate the mixed collection
        $perPage = 15;
        $currentPage = $request->input('page', 1);
        $paginatedPosts = new \Illuminate\Pagination\LengthAwarePaginator(
            $mixed->forPage($currentPage, $perPage),
            $mixed->count(),
            $perPage,
            $currentPage,
            ['path' => $request->url()]
        );

        return Inertia::render('Community/Feed', [
            'initialPosts' => $paginatedPosts,
        ]);
    }

    /**
     * Show a user profile page.
     */
    public function profile(Request $request, string $username): Response
    {
        $profileUser = User::where('username', $username)
            ->select('id', 'name', 'username', 'avatar', 'bio', 'created_at')
            ->firstOrFail();

        $currentUser = $request->user();

        // Get profile stats
        $stats = [
            'followers_count' => $profileUser->followers()->count(),
            'following_count' => $profileUser->following()->count(),
            'posts_count' => $profileUser->posts()->count(),
            'mocs_count' => $profileUser->mocs()->count(),
        ];

        // Check if current user follows this profile
        $isFollowing = $currentUser ? $currentUser->isFollowing($profileUser) : false;
        $isSelf = $currentUser ? $currentUser->id === $profileUser->id : false;

        // Get user's posts
        $posts = Post::where('user_id', $profileUser->id)
            ->with([
                'user:id,name,username,avatar',
                'images',
            ])
            ->withCount(['likes', 'comments'])
            ->orderByDesc('created_at')
            ->paginate(15);

        // Add is_liked flag
        if ($currentUser) {
            $likedPostIds = DB::table('likes')
                ->where('user_id', $currentUser->id)
                ->where('likeable_type', Post::class)
                ->whereIn('likeable_id', $posts->pluck('id'))
                ->pluck('likeable_id')
                ->toArray();

            $posts->getCollection()->transform(function ($post) use ($likedPostIds) {
                $post->is_liked = in_array($post->id, $likedPostIds);
                return $post;
            });
        }

        return Inertia::render('Community/Profile', [
            'profileUser' => $profileUser,
            'stats' => $stats,
            'isFollowing' => $isFollowing,
            'isSelf' => $isSelf,
            'initialPosts' => $posts,
        ]);
    }

    /**
     * Show a single post page.
     */
    public function showPost(Request $request, string $id): Response
    {
        $post = Post::with([
            'user:id,name,username,avatar',
            'images',
            'topLevelComments' => function ($query) {
                $query->with([
                    'user:id,name,username,avatar',
                    'replies' => function ($q) {
                        $q->with('user:id,name,username,avatar')
                            ->withCount('likes')
                            ->orderBy('created_at');
                    },
                ])->withCount('likes')->orderByDesc('created_at');
            },
        ])
            ->withCount(['likes', 'comments'])
            ->findOrFail($id);

        $currentUser = $request->user();

        if ($currentUser) {
            $post->is_liked = $post->isLikedBy($currentUser);

            // Add is_liked to comments
            $likedCommentIds = DB::table('likes')
                ->where('user_id', $currentUser->id)
                ->where('likeable_type', \App\Models\Comment::class)
                ->pluck('likeable_id')
                ->toArray();

            $post->topLevelComments->transform(function ($comment) use ($likedCommentIds) {
                $comment->is_liked = in_array($comment->id, $likedCommentIds);
                $comment->replies->transform(function ($reply) use ($likedCommentIds) {
                    $reply->is_liked = in_array($reply->id, $likedCommentIds);
                    return $reply;
                });
                return $comment;
            });
        } else {
            $post->is_liked = false;
        }

        return Inertia::render('Community/PostDetail', [
            'post' => $post,
        ]);
    }
}
