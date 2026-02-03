<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegoModel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StoreController extends Controller
{
  /**
   * Get public stats for the homepage.
   */
  public function stats(): JsonResponse
  {
    $totalModels = LegoModel::public()->count();
    $freeModels = LegoModel::public()->where(function ($query) {
      $query->whereNull('price')->orWhere('price', '<=', 0);
    })->count();
    $paidModels = LegoModel::public()->where('price', '>', 0)->count();
    $totalUsers = User::count();
    $totalParts = LegoModel::public()->sum('total_parts');

    return response()->json([
      'total_models' => $totalModels,
      'free_models' => $freeModels,
      'paid_models' => $paidModels,
      'total_users' => $totalUsers,
      'total_parts' => $totalParts,
    ]);
  }

  /**
   * List public models for the store with filtering and sorting.
   */
  public function index(Request $request): JsonResponse
  {
    $query = LegoModel::public()->with('user:id,name');

    // Filter by price type
    $filter = $request->input('filter', 'all');
    if ($filter === 'free') {
      $query->where(function ($q) {
        $q->whereNull('price')->orWhere('price', '<=', 0);
      });
    } elseif ($filter === 'paid') {
      $query->where('price', '>', 0);
    }

    // Search by name or description
    $search = $request->input('search');
    if ($search) {
      $query->where(function ($q) use ($search) {
        $q->where('name', 'like', "%{$search}%")
          ->orWhere('description', 'like', "%{$search}%");
      });
    }

    // Sorting
    $sort = $request->input('sort', 'newest');
    switch ($sort) {
      case 'oldest':
        $query->oldest();
        break;
      case 'name':
        $query->orderBy('name');
        break;
      case 'price_low':
        $query->orderByRaw('COALESCE(price, 0) ASC');
        break;
      case 'price_high':
        $query->orderByRaw('COALESCE(price, 0) DESC');
        break;
      case 'popular':
        // For now, order by created_at; later could add view count
        $query->latest();
        break;
      case 'newest':
      default:
        $query->latest();
        break;
    }

    // Featured models
    if ($request->boolean('featured')) {
      $query->limit($request->input('limit', 6));
    }

    $models = $query->get([
      'id',
      'name',
      'description',
      'file_name',
      'total_steps',
      'total_parts',
      'user_id',
      'is_public',
      'price',
      'thumbnail',
      'created_at',
    ]);

    return response()->json($models);
  }
}
