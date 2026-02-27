<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Api\CatalogController;
use App\Models\Color;
use App\Models\Minifig;
use App\Models\Moc;
use App\Models\Part;
use App\Models\PartCategory;
use App\Models\Set;
use App\Models\Theme;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Handles Inertia page rendering for the catalog section.
 * Data is passed via server-side props (not client-side API calls) for performance.
 */
class CatalogPageController extends Controller
{
  /**
   * Main catalog discovery page.
   * Shows popular sets, popular MOCs, latest MOCs, and stats.
   */
  public function index(): Response
  {
    $stats = [
      'sets' => Set::official()->count(),
      'mocs' => Set::mocs()->count(),
      'parts' => Part::count(),
      'minifigs' => Minifig::count(),
      'colors' => Color::count(),
      'themes' => Theme::count(),
    ];

    // Popular sets (most parts, recent years)
    $popularSets = Set::official()
      ->with('theme')
      ->where('year', '>=', 2020)
      ->where('num_parts', '>=', 500)
      ->orderByDesc('num_parts')
      ->limit(12)
      ->get()
      ->map(fn($set) => [
        'set_num' => $set->set_num,
        'name' => $set->name,
        'year' => $set->year,
        'num_parts' => $set->num_parts,
        'theme' => $set->theme ? ['id' => $set->theme->id, 'name' => $set->theme->name] : null,
        'image_url' => $set->img_url ?? ($set->custom_image ? "/storage/{$set->custom_image}" : "https://cdn.rebrickable.com/media/sets/{$set->set_num}.jpg"),
      ]);

    // Popular MOCs (from the Moc model - public, with images)
    $popularMocs = Moc::with(['user:id,name', 'images', 'set.theme'])
      ->public()
      ->whereNotNull('price')
      ->orderByDesc('total_parts')
      ->limit(12)
      ->get()
      ->map(fn($moc) => [
        'set_num' => $moc->set_num,
        'name' => $moc->name ?? $moc->set?->name ?? 'Unknown',
        'year' => $moc->set?->year ?? date('Y'),
        'num_parts' => $moc->total_parts ?? $moc->set?->num_parts ?? 0,
        'total_steps' => $moc->total_steps,
        'price' => $moc->price,
        'thumbnail' => $moc->thumbnail,
        'image_url' => $moc->thumbnail ?? "https://cdn.rebrickable.com/media/sets/{$moc->set_num}.jpg",
        'theme' => $moc->set?->theme ? ['id' => $moc->set->theme->id, 'name' => $moc->set->theme->name] : null,
        'user' => $moc->user ? ['id' => $moc->user->id, 'name' => $moc->user->name] : null,
      ]);

    // Latest MOCs
    $latestMocs = Moc::with(['user:id,name', 'images', 'set.theme'])
      ->public()
      ->latest()
      ->limit(12)
      ->get()
      ->map(fn($moc) => [
        'set_num' => $moc->set_num,
        'name' => $moc->name ?? $moc->set?->name ?? 'Unknown',
        'year' => $moc->set?->year ?? date('Y'),
        'num_parts' => $moc->total_parts ?? $moc->set?->num_parts ?? 0,
        'total_steps' => $moc->total_steps,
        'price' => $moc->price,
        'thumbnail' => $moc->thumbnail,
        'image_url' => $moc->thumbnail ?? "https://cdn.rebrickable.com/media/sets/{$moc->set_num}.jpg",
        'theme' => $moc->set?->theme ? ['id' => $moc->set->theme->id, 'name' => $moc->set->theme->name] : null,
        'user' => $moc->user ? ['id' => $moc->user->id, 'name' => $moc->user->name] : null,
      ]);

    // Popular themes (top themes by set count, excluding empty themes)
    $popularThemes = Theme::withCount('sets')
      ->whereNull('parent_id')
      ->having('sets_count', '>', 0)
      ->orderByDesc('sets_count')
      ->limit(8)
      ->get()
      ->map(fn($theme) => [
        'id' => $theme->id,
        'name' => $theme->name,
        'sets_count' => $theme->sets_count,
      ]);

    // Latest sets (newest additions)
    $latestSets = Set::official()
      ->with('theme')
      ->orderByDesc('year')
      ->orderByDesc('set_num')
      ->limit(12)
      ->get()
      ->map(fn($set) => [
        'set_num' => $set->set_num,
        'name' => $set->name,
        'year' => $set->year,
        'num_parts' => $set->num_parts,
        'theme' => $set->theme ? ['id' => $set->theme->id, 'name' => $set->theme->name] : null,
        'image_url' => $set->img_url ?? "https://cdn.rebrickable.com/media/sets/{$set->set_num}.jpg",
      ]);

    return Inertia::render('Catalog', [
      'stats' => $stats,
      'popularSets' => $popularSets,
      'popularMocs' => $popularMocs,
      'latestMocs' => $latestMocs,
      'latestSets' => $latestSets,
      'popularThemes' => $popularThemes,
    ]);
  }

  /**
   * Sets listing page with server-side filtering/pagination.
   */
  public function sets(Request $request): Response
  {
    $themes = Theme::whereNull('parent_id')
      ->with('children:id,name,parent_id')
      ->withCount('sets')
      ->orderBy('name')
      ->get()
      ->map(fn($t) => [
        'id' => $t->id,
        'name' => $t->name,
        'sets_count' => $t->sets_count,
        'children' => $t->children->map(fn($c) => [
          'id' => $c->id,
          'name' => $c->name,
        ])->toArray(),
      ]);

    $yearRange = [
      'min' => Set::official()->min('year') ?? 1950,
      'max' => Set::official()->max('year') ?? (int) date('Y'),
    ];

    return Inertia::render('CatalogSets', [
      'themes' => $themes,
      'yearRange' => $yearRange,
    ]);
  }

  /**
   * MOCs listing page with server-side filtering/pagination.
   */
  public function mocs(Request $request): Response
  {
    $themes = Theme::whereNull('parent_id')
      ->withCount('sets')
      ->orderBy('name')
      ->get()
      ->map(fn($t) => [
        'id' => $t->id,
        'name' => $t->name,
        'sets_count' => $t->sets_count,
      ]);

    return Inertia::render('CatalogMocs', [
      'themes' => $themes,
    ]);
  }

  /**
   * Parts listing page with server-side filtering/pagination.
   */
  public function parts(Request $request): Response
  {
    $categories = PartCategory::withCount('parts')
      ->orderBy('name')
      ->get()
      ->map(fn($c) => [
        'id' => $c->id,
        'name' => $c->name,
        'parts_count' => $c->parts_count,
      ]);

    $colors = Color::orderBy('name')
      ->get()
      ->map(fn($c) => [
        'id' => $c->id,
        'name' => $c->name,
        'rgb' => $c->rgb,
        'is_trans' => $c->is_trans,
      ]);

    return Inertia::render('CatalogParts', [
      'categories' => $categories,
      'colors' => $colors,
    ]);
  }

  /**
   * Minifigs listing page with server-side filtering/pagination.
   */
  public function minifigs(Request $request): Response
  {
    return Inertia::render('CatalogMinifigs', []);
  }

  /**
   * Themes listing page with hierarchical display.
   */
  public function themes(Request $request): Response
  {
    $stats = [
      'sets' => Set::official()->count(),
      'mocs' => Set::mocs()->count(),
      'parts' => Part::count(),
      'minifigs' => Minifig::count(),
      'themes' => Theme::count(),
    ];

    return Inertia::render('CatalogThemes', [
      'stats' => $stats,
    ]);
  }
}
