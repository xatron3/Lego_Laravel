<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowController extends Controller
{
  /**
   * Follow a user.
   */
  public function follow(Request $request, string $id): JsonResponse
  {
    $user = User::findOrFail($id);
    $currentUser = $request->user();

    if ($user->id === $currentUser->id) {
      return response()->json(['message' => 'You cannot follow yourself.'], 422);
    }

    $currentUser->follow($user);

    return response()->json([
      'message' => 'Successfully followed user.',
      'followers_count' => $user->followers()->count(),
      'is_following' => true,
    ]);
  }

  /**
   * Unfollow a user.
   */
  public function unfollow(Request $request, string $id): JsonResponse
  {
    $user = User::findOrFail($id);
    $currentUser = $request->user();

    $currentUser->unfollow($user);

    return response()->json([
      'message' => 'Successfully unfollowed user.',
      'followers_count' => $user->followers()->count(),
      'is_following' => false,
    ]);
  }

  /**
   * Get followers for a user.
   */
  public function followers(Request $request, string $id): JsonResponse
  {
    $user = User::findOrFail($id);
    $currentUser = $request->user();

    $followers = $user->followerUsers()
      ->select('users.id', 'users.name', 'users.username', 'users.avatar')
      ->paginate(20);

    // Add is_following flag for each follower
    if ($currentUser) {
      $followingIds = $currentUser->following()->pluck('following_id')->toArray();
      $followers->getCollection()->transform(function ($follower) use ($followingIds, $currentUser) {
        $follower->is_following = in_array($follower->id, $followingIds);
        $follower->is_self = $follower->id === $currentUser->id;
        return $follower;
      });
    }

    return response()->json($followers);
  }

  /**
   * Get users that a user is following.
   */
  public function following(Request $request, string $id): JsonResponse
  {
    $user = User::findOrFail($id);
    $currentUser = $request->user();

    $following = $user->followingUsers()
      ->select('users.id', 'users.name', 'users.username', 'users.avatar')
      ->paginate(20);

    // Add is_following flag
    if ($currentUser) {
      $followingIds = $currentUser->following()->pluck('following_id')->toArray();
      $following->getCollection()->transform(function ($followedUser) use ($followingIds, $currentUser) {
        $followedUser->is_following = in_array($followedUser->id, $followingIds);
        $followedUser->is_self = $followedUser->id === $currentUser->id;
        return $followedUser;
      });
    }

    return response()->json($following);
  }
}
