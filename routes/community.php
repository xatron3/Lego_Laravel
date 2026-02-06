<?php

use App\Http\Controllers\Api\FollowController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\SocialController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Social / Community Routes
|--------------------------------------------------------------------------
|
| Routes for user profiles, follows, posts, feed, likes, and comments.
|
*/

/*
|--------------------------------------------------------------------------
| Inertia Page Routes (Web)
|--------------------------------------------------------------------------
*/

// Community feed (public - shows random posts for non-auth users)
Route::middleware('web')->group(function () {
    Route::get('/community', [SocialController::class, 'feed'])->name('community.feed');
});

// Public community pages - need 'web' middleware for Inertia
Route::middleware('web')->group(function () {
    // Single post detail (public)
    Route::get('/community/posts/{id}', [SocialController::class, 'showPost'])
        ->where('id', '[0-9]+')
        ->name('community.post');

    // User profile pages (public) - must be last to avoid catching other routes
    Route::get('/u/{username}', [SocialController::class, 'profile'])
        ->where('username', '[a-zA-Z0-9_-]+')
        ->name('user.profile');
});

/*
|--------------------------------------------------------------------------
| API Routes (JSON)
|--------------------------------------------------------------------------
*/

Route::prefix('api')->group(function () {
    // Public: get posts for a user
    Route::get('users/{id}/posts', [PostController::class, 'userPosts']);

    // Public: get followers/following
    Route::get('users/{id}/followers', [FollowController::class, 'followers']);
    Route::get('users/{id}/following', [FollowController::class, 'following']);

    // Authenticated routes - use 'web' + 'auth' for session-based SPA auth
    Route::middleware(['web', 'auth'])->group(function () {
        // Feed
        Route::get('feed', [PostController::class, 'feed']);

        // Posts
        Route::post('posts', [PostController::class, 'store']);
        Route::get('posts/{id}', [PostController::class, 'show']);
        Route::delete('posts/{id}', [PostController::class, 'destroy']);

        // Likes
        Route::post('posts/{id}/like', [PostController::class, 'like']);
        Route::delete('posts/{id}/like', [PostController::class, 'unlike']);

        // Comments
        Route::post('posts/{id}/comments', [PostController::class, 'comment']);
        Route::delete('posts/{postId}/comments/{commentId}', [PostController::class, 'deleteComment']);

        // Comment likes
        Route::post('comments/{id}/like', [PostController::class, 'likeComment']);
        Route::delete('comments/{id}/like', [PostController::class, 'unlikeComment']);

        // Follow/Unfollow
        Route::post('users/{id}/follow', [FollowController::class, 'follow']);
        Route::delete('users/{id}/follow', [FollowController::class, 'unfollow']);

        // Update profile (username, bio)
        Route::put('user/profile', function (\Illuminate\Http\Request $request) {
            $validated = $request->validate([
                'username' => [
                    'sometimes',
                    'string',
                    'min:3',
                    'max:30',
                    'regex:/^[a-zA-Z0-9_-]+$/',
                    'unique:users,username,' . $request->user()->id,
                ],
                'bio' => 'sometimes|nullable|string|max:500',
            ]);

            $request->user()->update($validated);

            return response()->json([
                'message' => 'Profile updated.',
                'user' => $request->user()->only('id', 'name', 'username', 'avatar', 'bio'),
            ]);
        });
    });
});
