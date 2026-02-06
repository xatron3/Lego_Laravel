<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostImage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    /**
     * Get feed posts with algorithmic mixing.
     */
    public function feed(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            // Non-authenticated: show high-engagement posts
            $posts = Post::highEngagement(null, [], 15)
                ->with([
                    'user:id,name,username,avatar',
                    'images',
                ])
                ->get();

            // Fill quota if needed
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

            return response()->json($paginatedPosts);
        }

        // Authenticated: mix followed + algorithmic
        $followingIds = $user->following()->pluck('following_id')->toArray();

        $followedPosts = Post::feed($user)
            ->with([
                'user:id,name,username,avatar',
                'images',
            ])
            ->withCount(['likes', 'comments'])
            ->orderByDesc('created_at')
            ->limit(30)
            ->get();

        $totalNeeded = max(10, $followedPosts->count());
        $algorithmicNeeded = max(0, $totalNeeded - $followedPosts->count());

        $excludeUserIds = array_merge(
            $followedPosts->pluck('user_id')->unique()->toArray(),
            [$user->id]
        );

        $algorithmicPosts = Post::highEngagement($user, $excludeUserIds, $algorithmicNeeded + 5)
            ->with([
                'user:id,name,username,avatar',
                'images',
            ])
            ->get();

        // Mix posts
        $mixed = collect();
        $followedIndex = 0;
        $algorithmicIndex = 0;
        $postsSinceLastAlgorithmic = 0;

        while ($followedIndex < $followedPosts->count() || $algorithmicIndex < $algorithmicPosts->count()) {
            while ($postsSinceLastAlgorithmic < 3 && $followedIndex < $followedPosts->count()) {
                $mixed->push($followedPosts[$followedIndex]);
                $followedIndex++;
                $postsSinceLastAlgorithmic++;
            }

            if ($postsSinceLastAlgorithmic >= 3 && $algorithmicIndex < $algorithmicPosts->count()) {
                $mixed->push($algorithmicPosts[$algorithmicIndex]);
                $algorithmicIndex++;
                $postsSinceLastAlgorithmic = 0;
            }

            if ($followedIndex >= $followedPosts->count() && $algorithmicIndex < $algorithmicPosts->count()) {
                $mixed->push($algorithmicPosts[$algorithmicIndex]);
                $algorithmicIndex++;
            }
        }

        $mixed = $mixed->take(max(10, $mixed->count()));

        // Fill quota if needed
        if ($mixed->count() < 10) {
            $excludePostIds = $mixed->pluck('id')->toArray();
            $excludeUserIds = array_merge(
                $mixed->pluck('user_id')->unique()->toArray(),
                [$user->id]
            );

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

        $mixed = $mixed->take(15);

        // Add is_liked, is_following, and is_from_feed flags
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

        // Paginate
        $perPage = 15;
        $currentPage = $request->input('page', 1);
        $paginatedPosts = new \Illuminate\Pagination\LengthAwarePaginator(
            $mixed->forPage($currentPage, $perPage),
            $mixed->count(),
            $perPage,
            $currentPage,
            ['path' => $request->url()]
        );

        return response()->json($paginatedPosts);
    }

    /**
     * Get posts for a specific user.
     */
    public function userPosts(Request $request, string $id): JsonResponse
    {
        $currentUser = $request->user();

        $query = Post::where('user_id', $id)
            ->with([
                'user:id,name,username,avatar',
                'images',
            ])
            ->withCount(['likes', 'comments'])
            ->orderByDesc('created_at');

        // Filter by visibility
        if (!$currentUser || $currentUser->id != $id) {
            // If viewing someone else's profile
            if ($currentUser && $currentUser->isFollowing(User::find($id))) {
                // Show public and followers-only posts if following
                $query->whereIn('visibility', ['public', 'followers_only']);
            } else {
                // Show only public posts if not following
                $query->where('visibility', 'public');
            }
        }
        // If viewing own profile, show all posts (no filter)

        $posts = $query->paginate(15);

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

        return response()->json($posts);
    }

    /**
     * Create a new post.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|in:build,moc',
            'body' => 'nullable|string|max:3000', // ~500 words
            'visibility' => 'required|in:public,followers_only',
            'images' => 'required|array|min:1|max:10',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB per image
        ]);

        $post = DB::transaction(function () use ($request, $validated) {
            $post = Post::create([
                'user_id' => $request->user()->id,
                'type' => $validated['type'],
                'title' => $validated['title'],
                'body' => $validated['body'] ?? null,
                'visibility' => $validated['visibility'],
            ]);

            // Handle image uploads
            if ($request->hasFile('images')) {
                foreach ($request->file('images') as $index => $image) {
                    $path = $image->store('posts/' . $post->id, 'public');

                    PostImage::create([
                        'post_id' => $post->id,
                        'path' => $path,
                        'filename' => $image->getClientOriginalName(),
                        'sort_order' => $index,
                    ]);
                }
            }

            return $post;
        });

        $post->load(['user:id,name,username,avatar', 'images']);
        $post->loadCount(['likes', 'comments']);
        $post->is_liked = false;

        return response()->json($post, 201);
    }

    /**
     * Show a single post.
     */
    public function show(Request $request, string $id): JsonResponse
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

        return response()->json($post);
    }

    /**
     * Delete a post.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $post = Post::findOrFail($id);

        if ($post->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Delete associated images from storage
        foreach ($post->images as $image) {
            Storage::disk('public')->delete($image->path);
        }

        $post->delete();

        return response()->json(['message' => 'Post deleted.']);
    }

    /**
     * Like a post.
     */
    public function like(Request $request, string $id): JsonResponse
    {
        $post = Post::findOrFail($id);
        $user = $request->user();

        $post->likes()->firstOrCreate(['user_id' => $user->id]);

        return response()->json([
            'likes_count' => $post->likes()->count(),
            'is_liked' => true,
        ]);
    }

    /**
     * Unlike a post.
     */
    public function unlike(Request $request, string $id): JsonResponse
    {
        $post = Post::findOrFail($id);
        $user = $request->user();

        $post->likes()->where('user_id', $user->id)->delete();

        return response()->json([
            'likes_count' => $post->likes()->count(),
            'is_liked' => false,
        ]);
    }

    /**
     * Add a comment to a post.
     */
    public function comment(Request $request, string $id): JsonResponse
    {
        $post = Post::findOrFail($id);

        $validated = $request->validate([
            'body' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $comment = $post->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $validated['body'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        $comment->load('user:id,name,username,avatar');
        $comment->loadCount('likes');
        $comment->is_liked = false;

        return response()->json($comment, 201);
    }

    /**
     * Delete a comment.
     */
    public function deleteComment(Request $request, string $postId, string $commentId): JsonResponse
    {
        $comment = \App\Models\Comment::findOrFail($commentId);

        if ($comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted.']);
    }

    /**
     * Like a comment.
     */
    public function likeComment(Request $request, string $commentId): JsonResponse
    {
        $comment = \App\Models\Comment::findOrFail($commentId);
        $user = $request->user();

        $comment->likes()->firstOrCreate(['user_id' => $user->id]);

        return response()->json([
            'likes_count' => $comment->likes()->count(),
            'is_liked' => true,
        ]);
    }

    /**
     * Unlike a comment.
     */
    public function unlikeComment(Request $request, string $commentId): JsonResponse
    {
        $comment = \App\Models\Comment::findOrFail($commentId);
        $user = $request->user();

        $comment->likes()->where('user_id', $user->id)->delete();

        return response()->json([
            'likes_count' => $comment->likes()->count(),
            'is_liked' => false,
        ]);
    }
}
