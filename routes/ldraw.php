<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Log;

/*
|--------------------------------------------------------------------------
| LDraw File Serving Routes
|--------------------------------------------------------------------------
|
| Handles serving LDraw library files (.dat/.ldr/.mpd) with BOM stripping
| and proper caching headers. These routes handle the LDrawLoader's
| various path request formats.
|
*/

/**
 * Serve an LDraw file with BOM stripping and proper headers.
 */
if (!function_exists('serveLDrawFile')) {
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
}

/**
 * Find an LDraw file in the various possible locations.
 * Handles various path formats the LDrawLoader might request.
 */
if (!function_exists('findLDrawFile')) {
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

    // If still not found, try to find a fallback for patterned parts
    // Patterned parts have names like 3068bpb0064.dat or 3069bp01.dat
    // The base part is 3068b.dat or 3069b.dat
    if (preg_match('/^(\d+[a-z]*)p[bp]?\d+\.dat$/i', $fileName, $matches)) {
      $basePart = $matches[1] . '.dat';
      $fallbackPath = public_path("ldraw/parts/{$basePart}");
      if (file_exists($fallbackPath)) {
        Log::warning("LDraw pattern not found: {$fileName}, using base part: {$basePart}");
        return $fallbackPath;
      }
    }

    return null;
  }
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

// Handle /models/xxx.dat requests (LDraw models, not user MOCs)
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

// Catch-all for root-level .dat/.ldr/.mpd files (e.g., /3001.dat)
Route::get('/{file}', function ($file) {
  $fullPath = findLDrawFile($file);
  if ($fullPath) {
    return serveLDrawFile($fullPath);
  }
  abort(404, "LDraw file not found: {$file}");
})->where('file', '[^\/]+\.(dat|ldr|mpd)$');
