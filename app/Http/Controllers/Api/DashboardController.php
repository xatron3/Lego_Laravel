<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class DashboardController extends Controller
{
  /**
   * Get models for the dashboard with ownership filter.
   */
  public function models(Request $request): JsonResponse
  {
    $user = $request->user();
    $filter = $request->input('filter', 'all');

    $models = collect();

    if ($filter === 'created' || $filter === 'all') {
      // Models created by the user
      $createdModels = $user->legoModels()
        ->with('user:id,name')
        ->get(['id', 'name', 'description', 'file_name', 'total_steps', 'total_parts', 'user_id', 'is_public', 'price', 'thumbnail', 'created_at'])
        ->map(function ($model) {
          $model->ownership_type = 'created';
          return $model;
        });

      $models = $models->merge($createdModels);
    }

    if ($filter === 'owned' || $filter === 'all') {
      // Models owned (purchased/claimed) by the user
      $ownedModels = $user->ownedModels()
        ->with('user:id,name')
        ->get()
        ->map(function ($model) {
          $model->ownership_type = $model->pivot->type;
          return $model;
        });

      $models = $models->merge($ownedModels);
    }

    // Remove duplicates (if a user created and claimed the same model, keep created)
    $models = $models->unique('id')->sortByDesc('created_at')->values();

    return response()->json($models);
  }

  /**
   * Update user settings.
   */
  public function updateSettings(Request $request): JsonResponse
  {
    $user = $request->user();

    $validated = $request->validate([
      'name' => 'sometimes|required|string|max:255',
      'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
      'current_password' => 'required_with:password|string',
      'password' => 'nullable|string|min:8|confirmed',
    ]);

    // Verify current password if changing password
    if (isset($validated['password'])) {
      if (!Hash::check($validated['current_password'], $user->password)) {
        return response()->json([
          'message' => 'Current password is incorrect.',
          'errors' => ['current_password' => ['The provided password does not match your current password.']],
        ], 422);
      }

      $user->password = $validated['password'];
    }

    if (isset($validated['name'])) {
      $user->name = $validated['name'];
    }

    if (isset($validated['email'])) {
      $user->email = $validated['email'];
    }

    $user->save();

    return response()->json([
      'message' => 'Settings updated successfully.',
      'user' => $user->only(['id', 'name', 'email', 'avatar', 'role']),
    ]);
  }
}
