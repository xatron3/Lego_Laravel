<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\CatalogPageController;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Catalog Routes (Rebrickable Data)
|--------------------------------------------------------------------------
|
| SEO-optimized routes for browsing LEGO sets, parts, minifigs, colors,
| themes, and categories from the Rebrickable database.
|
*/

// Catalog Pages (Inertia) - need web middleware for session
Route::middleware('web')->group(function () {
  // Main catalog discovery page
  Route::get('/catalog', [CatalogPageController::class, 'index'])->name('catalog');

  // Category listing pages
  Route::get('/catalog/sets', [CatalogPageController::class, 'sets'])->name('catalog.sets');
  Route::get('/catalog/mocs', [CatalogPageController::class, 'mocs'])->name('catalog.mocs');
  Route::get('/catalog/parts', [CatalogPageController::class, 'parts'])->name('catalog.parts');
  Route::get('/catalog/minifigs', [CatalogPageController::class, 'minifigs'])->name('catalog.minifigs');
  Route::get('/catalog/themes', [CatalogPageController::class, 'themes'])->name('catalog.themes');

  // SEO-Friendly Catalog Detail Pages with descriptive URLs
  Route::get('/catalog/sets/{setNum}/{name?}', function ($setNum, $name = null) {
    return Inertia::render('CatalogDetail', ['type' => 'set', 'id' => $setNum]);
  })->name('catalog.set');

  Route::get('/catalog/parts/{partNum}/{name?}', function ($partNum, $name = null) {
    return Inertia::render('CatalogDetail', ['type' => 'part', 'id' => $partNum]);
  })->name('catalog.part');

  Route::get('/catalog/minifigs/{figNum}/{name?}', function ($figNum, $name = null) {
    return Inertia::render('CatalogDetail', ['type' => 'minifig', 'id' => $figNum]);
  })->name('catalog.minifig');

  Route::get('/catalog/colors/{id}/{name?}', function ($id, $name = null) {
    return Inertia::render('CatalogDetail', ['type' => 'color', 'id' => (string) $id]);
  })->where('id', '[0-9]+')->name('catalog.color');

  Route::get('/catalog/themes/{id}/{name?}', function ($id, $name = null) {
    return Inertia::render('CatalogDetail', ['type' => 'theme', 'id' => (string) $id]);
  })->where('id', '[0-9]+')->name('catalog.theme');

  Route::get('/catalog/categories/{id}/{name?}', function ($id, $name = null) {
    return Inertia::render('CatalogDetail', ['type' => 'category', 'id' => (string) $id]);
  })->where('id', '[0-9]+')->name('catalog.category');
});

// Catalog API Routes
Route::prefix('api/catalog')->group(function () {
  Route::get('/stats', [CatalogController::class, 'stats']);
  Route::get('/search', [CatalogController::class, 'searchAutocomplete']);
  Route::get('/sets', [CatalogController::class, 'sets']);
  Route::get('/sets/{setNum}', [CatalogController::class, 'showSet']);
  Route::get('/mocs', [CatalogController::class, 'mocs']);
  Route::get('/mocs/{setNum}', [CatalogController::class, 'showMoc']);
  Route::get('/parts', [CatalogController::class, 'parts']);
  Route::get('/parts/{partNum}', [CatalogController::class, 'showPart']);
  Route::get('/minifigs', [CatalogController::class, 'minifigs']);
  Route::get('/minifigs/{figNum}', [CatalogController::class, 'showMinifig']);
  Route::get('/colors', [CatalogController::class, 'colors']);
  Route::get('/colors/{colorId}', [CatalogController::class, 'showColor']);
  Route::get('/themes', [CatalogController::class, 'themes']);
  Route::get('/themes/{themeId}', [CatalogController::class, 'showTheme']);
  Route::get('/categories', [CatalogController::class, 'categories']);
  Route::get('/categories/{categoryId}', [CatalogController::class, 'showCategory']);
  Route::get('/year-range', [CatalogController::class, 'yearRange']);
});
