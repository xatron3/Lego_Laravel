<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Response;
use App\Http\Controllers\Auth\GoogleController;

/*
|--------------------------------------------------------------------------
| CSRF Cookie Route (Required for Sanctum SPA Auth)
|--------------------------------------------------------------------------
*/

Route::get('/sanctum/csrf-cookie', function () {
  return response()->json(['message' => 'CSRF cookie set']);
});

/*
|--------------------------------------------------------------------------
| Google OAuth Routes
|--------------------------------------------------------------------------
*/

Route::get('/auth/google', [GoogleController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('auth.google.callback');

/**
 * Serve an LDraw file with BOM stripping and proper headers.
 */
function serveLDrawFile(string $fullPath): \Illuminate\Http\Response
{
  $content = file_get_contents($fullPath);

  // Remove BOM from various encodings
  $bom = pack('H*', 'EFBBBF'); // UTF-8 BOM
  $content = preg_replace("/^$bom/", '', $content);

  // Also try hex codes for other BOMs
  $content = str_replace("\xEF\xBB\xBF", '', $content); // UTF-8
  $content = str_replace("\xFF\xFE", '', $content);     // UTF-16 LE
  $content = str_replace("\xFE\xFF", '', $content);     // UTF-16 BE

  return Response::make($content, 200, [
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Cache-Control' => 'public, max-age=31536000',
  ]);
}

/**
 * Find an LDraw file in the various possible locations.
 * Handles various path formats the LDrawLoader might request.
 */
function findLDrawFile(string $path): ?string
{
  // Clean up the path - remove leading slashes
  $path = ltrim($path, '/');

  // Handle double-prefixed paths like "parts/s/xxx.dat" or "parts/parts/s/xxx.dat"
  // Keep removing "parts/" prefix until we get to the actual path
  while (str_starts_with($path, 'parts/')) {
    $path = substr($path, 6);
  }

  // Handle "p/" prefix for primitives embedded in parts requests
  // e.g., "p/48/xxx.dat" or "p/xxx.dat"
  if (str_starts_with($path, 'p/')) {
    $subPath = substr($path, 2);
    // Try direct primitive path
    $fullPath = public_path("ldraw/p/{$subPath}");
    if (file_exists($fullPath)) {
      return $fullPath;
    }
    // If not found, extract just filename and search
    $fileName = basename($subPath);
    foreach (["ldraw/p/{$fileName}", "ldraw/p/48/{$fileName}", "ldraw/p/8/{$fileName}"] as $searchPath) {
      $fullPath = public_path($searchPath);
      if (file_exists($fullPath)) {
        return $fullPath;
      }
    }
  }

  // Handle "s/xxx.dat" subparts
  if (str_starts_with($path, 's/')) {
    $fileName = substr($path, 2);
    $fullPath = public_path("ldraw/parts/s/{$fileName}");
    if (file_exists($fullPath)) {
      return $fullPath;
    }
  }

  // Handle "48/xxx.dat" hi-res primitives
  if (str_starts_with($path, '48/')) {
    $fileName = substr($path, 3);
    $fullPath = public_path("ldraw/p/48/{$fileName}");
    if (file_exists($fullPath)) {
      return $fullPath;
    }
  }

  // Handle "8/xxx.dat" lo-res primitives
  if (str_starts_with($path, '8/')) {
    $fileName = substr($path, 2);
    $fullPath = public_path("ldraw/p/8/{$fileName}");
    if (file_exists($fullPath)) {
      return $fullPath;
    }
  }

  // Extract just the filename for general search
  $fileName = basename($path);

  // Search paths in order of likelihood
  $searchPaths = [
    "ldraw/parts/{$fileName}",
    "ldraw/p/{$fileName}",
    "ldraw/models/{$fileName}",
    "ldraw/{$fileName}",
    "ldraw/parts/s/{$fileName}",
    "ldraw/p/48/{$fileName}",
    "ldraw/p/8/{$fileName}",
  ];

  foreach ($searchPaths as $searchPath) {
    $fullPath = public_path($searchPath);
    if (file_exists($fullPath)) {
      return $fullPath;
    }
  }

  return null;
}

// Handle /parts/xxx.dat requests (LDrawLoader with setPartsLibraryPath("/"))
// The {file} can be "xxx.dat" or "s/xxx.dat" for subparts
Route::get('/parts/{file}', function ($file) {
  $fullPath = findLDrawFile($file);
  if ($fullPath) {
    return serveLDrawFile($fullPath);
  }
  abort(404, "LDraw part not found: {$file}");
})->where('file', '.*\.(dat|ldr|mpd)$');

// Handle /p/xxx.dat requests (primitives)
Route::get('/p/{file}', function ($file) {
  $fullPath = findLDrawFile($file);
  if ($fullPath) {
    return serveLDrawFile($fullPath);
  }
  abort(404, "LDraw primitive not found: {$file}");
})->where('file', '.*\.(dat|ldr|mpd)$');

// Handle /models/xxx.dat requests
Route::get('/models/{file}', function ($file) {
  $fullPath = findLDrawFile($file);
  if ($fullPath) {
    return serveLDrawFile($fullPath);
  }
  abort(404, "LDraw model not found: {$file}");
})->where('file', '.*\.(dat|ldr|mpd)$');

// LDraw file resolver - searches multiple directories for .dat/.ldr/.mpd files
Route::get('/ldraw/{path}', function ($path) {
  $fileName = basename($path);

  // Try the exact path first
  $exactPath = public_path("ldraw/{$path}");
  if (file_exists($exactPath)) {
    return serveLDrawFile($exactPath);
  }

  // Fall back to searching
  $fullPath = findLDrawFile($fileName);
  if ($fullPath) {
    return serveLDrawFile($fullPath);
  }

  abort(404, "LDraw file not found: {$fileName}");
})->where('path', '.*\.(dat|ldr|mpd)$');

/*
|--------------------------------------------------------------------------
| Inertia Page Routes
|--------------------------------------------------------------------------
*/

// Homepage
Route::get('/', function () {
  return Inertia::render('Welcome');
})->name('home');

// Store - browse and purchase models
Route::get('/store', function () {
  return Inertia::render('Store');
})->name('store');

// Catalog - browse LEGO parts, sets, and minifigs from Rebrickable database
Route::get('/catalog', function () {
  return Inertia::render('Catalog');
})->name('catalog');

// Catalog detail pages
Route::get('/catalog/set/{id}', function ($id) {
  return Inertia::render('CatalogDetail', ['type' => 'set', 'id' => $id]);
})->name('catalog.set');

Route::get('/catalog/part/{id}', function ($id) {
  return Inertia::render('CatalogDetail', ['type' => 'part', 'id' => $id]);
})->name('catalog.part');

Route::get('/catalog/minifig/{id}', function ($id) {
  return Inertia::render('CatalogDetail', ['type' => 'minifig', 'id' => $id]);
})->name('catalog.minifig');

Route::get('/catalog/color/{id}', function ($id) {
  return Inertia::render('CatalogDetail', ['type' => 'color', 'id' => (string) $id]);
})->where('id', '[0-9]+')->name('catalog.color');

Route::get('/catalog/theme/{id}', function ($id) {
  return Inertia::render('CatalogDetail', ['type' => 'theme', 'id' => (string) $id]);
})->where('id', '[0-9]+')->name('catalog.theme');

Route::get('/catalog/category/{id}', function ($id) {
  return Inertia::render('CatalogDetail', ['type' => 'category', 'id' => (string) $id]);
})->where('id', '[0-9]+')->name('catalog.category');

// Model detail page
Route::get('/model/{id}', function ($id) {
  return Inertia::render('ModelDetail', ['id' => $id]);
})->where('id', '[0-9]+')->name('model.show');

// Catch-all for root-level .dat/.ldr/.mpd files (e.g., /3001.dat)
Route::get('/{file}', function ($file) {
  $fullPath = findLDrawFile($file);
  if ($fullPath) {
    return serveLDrawFile($fullPath);
  }
  abort(404, "LDraw file not found: {$file}");
})->where('file', '[^\/]+\.(dat|ldr|mpd)$');

// Viewer - 3D model viewer
Route::get('/viewer', function () {
  return Inertia::render('Viewer');
})->name('viewer');

// Viewer with specific model
Route::get('/viewer/{id}', function ($id) {
  return Inertia::render('Viewer', ['modelId' => $id]);
})->where('id', '[0-9]+')->name('viewer.model');

// Dashboard - user profile and model management
Route::get('/dashboard', function () {
  return Inertia::render('Dashboard');
})->name('dashboard');

// Admin panel route
Route::get('/admin', function () {
  return Inertia::render('Admin');
})->name('admin');

// Catch-all route for SPA - allows client-side routing if needed
// Excludes API routes, static files (.dat, .ldr, .mpd, etc.), and the ldraw folder
Route::get('/{any}', function () {
  return Inertia::render('Welcome');
})->where('any', '^(?!api|ldraw|admin)(?!.*\.(dat|ldr|mpd|js|css|png|jpg|svg|ico|woff2?|ttf)).*$');
