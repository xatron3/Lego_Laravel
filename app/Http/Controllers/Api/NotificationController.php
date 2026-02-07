<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
  /**
   * Get paginated notifications for the authenticated user.
   */
  public function index(Request $request): JsonResponse
  {
    $notifications = Notification::where('user_id', $request->user()->id)
      ->with('actor:id,name,username,avatar')
      ->orderByDesc('created_at')
      ->paginate(20);

    return response()->json($notifications);
  }

  /**
   * Mark notifications as seen by updating the user's last_seen_notification_id.
   * Called when the user opens the notifications dropdown.
   */
  public function markSeen(Request $request): JsonResponse
  {
    $user = $request->user();

    $latestNotification = Notification::where('user_id', $user->id)
      ->latest()
      ->first();

    if ($latestNotification) {
      $user->last_seen_notification_id = $latestNotification->id;
      $user->save();
    }

    return response()->json([
      'message' => 'Notifications marked as seen.',
      'last_seen_notification_id' => $user->last_seen_notification_id,
    ]);
  }

  /**
   * Get unread notification count (notifications newer than last_seen_notification_id).
   */
  public function unreadCount(Request $request): JsonResponse
  {
    $user = $request->user();
    $count = $this->getUnreadCount($user);

    return response()->json(['count' => $count]);
  }

  /**
   * Calculate unread count for a user.
   */
  public static function getUnreadCount($user): int
  {
    $query = Notification::where('user_id', $user->id);

    if ($user->last_seen_notification_id) {
      $query->where('id', '>', $user->last_seen_notification_id);
    }

    return $query->count();
  }
}
