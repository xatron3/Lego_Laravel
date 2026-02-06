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
    // Get comprehensive stats
    $stats = [
      'total_models' => Moc::public()->count(),
      'total_parts' => Moc::public()->sum('total_parts'),
      'total_users' => \App\Models\User::count(),
      'free_models' => Moc::public()->whereNull('price')->count(),
      'paid_models' => Moc::public()->whereNotNull('price')->count(),
      'total_sets' => \App\Models\Set::count(),
      'total_themes' => \App\Models\Theme::count(),
      'total_colors' => \App\Models\Color::count(),
      'total_unique_parts' => \App\Models\Part::count(),
    ];

    // Fun stats
    $largestSet = \App\Models\Set::orderBy('num_parts', 'desc')->first();
    $oldestSet = \App\Models\Set::whereNotNull('year')->orderBy('year')->first();
    $newestSet = \App\Models\Set::whereNotNull('year')->orderBy('year', 'desc')->first();

    $funStats = [
      'largest_set' => $largestSet ? [
        'name' => $largestSet->name,
        'set_num' => $largestSet->set_num,
        'num_parts' => $largestSet->num_parts,
      ] : null,
      'oldest_set_year' => $oldestSet?->year,
      'newest_set_year' => $newestSet?->year,
    ];

    // Get popular themes (top 6 by set count)
    $popularThemes = \App\Models\Theme::withCount('sets')
      ->having('sets_count', '>', 0)
      ->orderBy('sets_count', 'desc')
      ->limit(6)
      ->get(['id', 'name'])
      ->map(fn($theme) => [
        'id' => $theme->id,
        'name' => $theme->name,
        'sets_count' => $theme->sets_count,
      ]);

    // Get popular sets (recent sets with most parts, limited to 6)
    $popularSets = \App\Models\Set::with('theme:id,name')
      ->whereNotNull('year')
      ->where('year', '>=', now()->year - 5)
      ->orderBy('num_parts', 'desc')
      ->limit(6)
      ->get(['set_num', 'name', 'year', 'theme_id', 'num_parts'])
      ->map(fn($set) => [
        'set_num' => $set->set_num,
        'name' => $set->name,
        'year' => $set->year,
        'num_parts' => $set->num_parts,
        'theme' => $set->theme?->name,
        'image_url' => "https://cdn.rebrickable.com/media/sets/{$set->set_num}.jpg",
      ]);

    // Get featured MOCs (latest public models with variety, limited to 6)
    $featuredModels = Moc::with(['user:id,name', 'images'])
      ->public()
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
      'funStats' => $funStats,
      'popularThemes' => $popularThemes,
      'popularSets' => $popularSets,
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
