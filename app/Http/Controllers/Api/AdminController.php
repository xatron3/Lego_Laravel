<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Moc;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
  /**
   * Get dashboard statistics.
   */
  public function stats(): JsonResponse
  {
    return response()->json([
      'users' => [
        'total' => User::count(),
        'by_role' => [
          'normal' => User::where('role', UserRole::NORMAL)->count(),
          'submitter' => User::where('role', UserRole::SUBMITTER)->count(),
          'mod' => User::where('role', UserRole::MOD)->count(),
          'admin' => User::where('role', UserRole::ADMIN)->count(),
        ],
      ],
      'models' => [
        'total' => Moc::count(),
        'public' => Moc::public()->count(),
        'private' => Moc::where('is_public', false)->count(),
        'paid' => Moc::whereNotNull('price')->where('price', '>', 0)->count(),
      ],
    ]);
  }

  /**
   * Get all users with pagination.
   */
  public function users(Request $request): JsonResponse
  {
    $users = User::withCount('mocs')
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('name', 'like', "%{$search}%")
            ->orWhere('email', 'like', "%{$search}%");
        });
      })
      ->when($request->role, function ($query, $role) {
        $query->where('role', $role);
      })
      ->orderBy($request->get('sort', 'created_at'), $request->get('direction', 'desc'))
      ->paginate($request->get('per_page', 20));

    return response()->json($users);
  }

  /**
   * Update a user's role.
   */
  public function updateUserRole(Request $request, User $user): JsonResponse
  {
    $validated = $request->validate([
      'role' => ['required', 'string', 'in:' . implode(',', UserRole::values())],
    ]);

    // Prevent demoting yourself if you're the only admin
    if ($request->user()->id === $user->id && $validated['role'] !== UserRole::ADMIN->value) {
      $adminCount = User::where('role', UserRole::ADMIN)->count();
      if ($adminCount <= 1) {
        return response()->json([
          'message' => 'Cannot demote the only administrator.',
        ], 422);
      }
    }

    $user->update(['role' => $validated['role']]);

    return response()->json([
      'message' => 'User role updated successfully.',
      'user' => [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'role' => $user->role->value,
      ],
    ]);
  }

  /**
   * Delete a user.
   */
  public function deleteUser(Request $request, User $user): JsonResponse
  {
    // Prevent deleting yourself
    if ($request->user()->id === $user->id) {
      return response()->json([
        'message' => 'Cannot delete your own account.',
      ], 422);
    }

    // Prevent deleting the only admin
    if ($user->isAdmin()) {
      $adminCount = User::where('role', UserRole::ADMIN)->count();
      if ($adminCount <= 1) {
        return response()->json([
          'message' => 'Cannot delete the only administrator.',
        ], 422);
      }
    }

    $user->delete();

    return response()->json([
      'message' => 'User deleted successfully.',
    ]);
  }

  /**
   * Get all MOCs with pagination (for admin management).
   */
  public function models(Request $request): JsonResponse
  {
    $models = Moc::with(['user:id,name,email', 'images'])
      ->when($request->search, function ($query, $search) {
        $query->where(function ($q) use ($search) {
          $q->where('name', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%");
        });
      })
      ->when($request->has('is_public'), function ($query) use ($request) {
        $query->where('is_public', $request->boolean('is_public'));
      })
      ->when($request->user_id, function ($query, $userId) {
        $query->where('user_id', $userId);
      })
      ->orderBy($request->get('sort', 'created_at'), $request->get('direction', 'desc'))
      ->paginate($request->get('per_page', 20));

    return response()->json($models);
  }

  /**
   * Update MOC visibility/status (admin action).
   */
  public function updateModel(Request $request, string $id): JsonResponse
  {
    $moc = Moc::findOrFail($id);

    $validated = $request->validate([
      'is_public' => ['sometimes', 'boolean'],
      'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
    ]);

    $moc->update($validated);

    return response()->json([
      'message' => 'MOC updated successfully.',
      'model' => $moc->fresh(['images']),
    ]);
  }

  /**
   * Delete a MOC (admin action).
   */
  public function deleteModel(string $id): JsonResponse
  {
    $moc = Moc::findOrFail($id);
    $moc->delete();

    return response()->json([
      'message' => 'MOC deleted successfully.',
    ]);
  }

  /**
   * Get admin sales analytics.
   */
  public function sales(Request $request): JsonResponse
  {
    // Check if user is admin
    if ($request->user()->role !== UserRole::ADMIN) {
      return response()->json(['error' => 'Unauthorized'], 403);
    }

    $totalSales = Order::where('status', 'completed')->count();
    $totalRevenue = Order::where('status', 'completed')->sum('total');
    $platformRevenue = Order::where('status', 'completed')->sum('platform_fee');

    // Get recent 50 sales with buyer, seller, and MOC info
    $recentSales = Order::where('status', 'completed')
      ->with(['user:id,name', 'items.moc:id,set_num,name', 'items.seller:id,name'])
      ->orderBy('created_at', 'desc')
      ->limit(50)
      ->get()
      ->flatMap(function ($order) {
        return $order->items->map(function ($item) use ($order) {
          return [
            'id' => $order->id,
            'buyer_name' => $order->user->name ?? 'Unknown',
            'seller_name' => $item->seller->name ?? 'Unknown',
            'moc_name' => $item->moc->name ?? 'Unknown',
            'total' => $order->total,
            'platform_fee' => $order->platform_fee,
            'created_at' => $order->created_at,
          ];
        });
      })
      ->take(50);

    return response()->json([
      'total_sales' => $totalSales,
      'total_revenue' => round((float)$totalRevenue, 2),
      'platform_revenue' => round((float)$platformRevenue, 2),
      'recent_sales' => $recentSales,
    ]);
  }
}
