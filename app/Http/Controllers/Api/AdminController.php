<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\LegoModel;
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
        'total' => LegoModel::count(),
        'public' => LegoModel::where('is_public', true)->count(),
        'private' => LegoModel::where('is_public', false)->count(),
        'paid' => LegoModel::whereNotNull('price')->where('price', '>', 0)->count(),
      ],
    ]);
  }

  /**
   * Get all users with pagination.
   */
  public function users(Request $request): JsonResponse
  {
    $users = User::withCount('legoModels')
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
   * Get all models with pagination (for admin management).
   */
  public function models(Request $request): JsonResponse
  {
    $models = LegoModel::with('user:id,name,email')
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
   * Update model visibility/status (admin action).
   */
  public function updateModel(Request $request, LegoModel $legoModel): JsonResponse
  {
    $validated = $request->validate([
      'is_public' => ['sometimes', 'boolean'],
      'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
    ]);

    $legoModel->update($validated);

    return response()->json([
      'message' => 'Model updated successfully.',
      'model' => $legoModel->fresh(),
    ]);
  }

  /**
   * Delete a model (admin action).
   */
  public function deleteModel(LegoModel $legoModel): JsonResponse
  {
    $legoModel->delete();

    return response()->json([
      'message' => 'Model deleted successfully.',
    ]);
  }
}
