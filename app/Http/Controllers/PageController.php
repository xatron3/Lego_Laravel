<?php

namespace App\Http\Controllers;

use App\Models\Moc;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
  public function welcome(): Response
  {
    // Get stats
    $stats = [
      'total_models' => Moc::public()->count(),
      'total_parts' => Moc::public()->sum('total_parts'),
      'total_users' => \App\Models\User::count(),
      'free_models' => Moc::public()->whereNull('price')->count(),
      'paid_models' => Moc::public()->whereNotNull('price')->count(),
    ];

    // Get featured models (latest public paid MOCs, limited to 6)
    $featuredModels = Moc::with(['user:id,name', 'images'])
      ->public()
      ->whereNotNull('price')
      ->latest()
      ->limit(6)
      ->get(['id', 'set_num', 'name', 'total_parts', 'total_steps', 'price', 'user_id'])
      ->map(fn($model) => [
        'id' => $model->id,
        'set_num' => $model->set_num,
        'name' => $model->name,
        'thumbnail' => $model->thumbnail,
        'total_parts' => $model->total_parts,
        'total_steps' => $model->total_steps,
        'price' => $model->price,
        'user' => $model->user ? ['name' => $model->user->name] : null,
      ]);

    return Inertia::render('Welcome', [
      'stats' => $stats,
      'featuredModels' => $featuredModels,
    ]);
  }

  public function store(Request $request): Response
  {
    $sort = $request->get('sort', 'newest');
    $filter = $request->get('filter', 'all');
    $search = $request->get('search');

    $query = Moc::with(['user:id,name', 'images'])
      ->public();

    // Apply filters
    if ($filter === 'free') {
      $query->whereNull('price');
    } elseif ($filter === 'paid') {
      $query->whereNotNull('price');
    }

    // Apply search
    if ($search) {
      $query->where(function ($q) use ($search) {
        $q->where('name', 'like', "%{$search}%")
          ->orWhere('description', 'like', "%{$search}%");
      });
    }

    // Apply sorting
    switch ($sort) {
      case 'popular':
        // For now, use created_at as proxy for popularity
        $query->latest();
        break;
      case 'price_low':
        $query->orderByRaw('COALESCE(price, 0) ASC');
        break;
      case 'price_high':
        $query->orderByRaw('COALESCE(price, 999999) DESC');
        break;
      case 'name':
        $query->orderBy('name');
        break;
      default: // newest
        $query->latest();
    }

    $models = $query->get()->map(function ($model) use ($request) {
      $data = [
        'id' => $model->id,
        'set_num' => $model->set_num,
        'name' => $model->name,
        'description' => $model->description,
        'thumbnail' => $model->thumbnail,
        'total_parts' => $model->total_parts,
        'total_steps' => $model->total_steps,
        'is_public' => $model->is_public,
        'price' => $model->price,
        'user' => $model->user ? [
          'id' => $model->user->id,
          'name' => $model->user->name,
        ] : null,
      ];

      // Hide LDR content unless user has access
      if (!$model->canAccessContent($request->user())) {
        $data['ldr_content'] = null;
      }

      return $data;
    });

    return Inertia::render('Store', [
      'initialModels' => $models,
      'initialSort' => $sort,
      'initialFilter' => $filter,
      'initialSearch' => $search,
    ]);
  }
}
