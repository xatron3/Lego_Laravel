<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Response;

// LDraw file resolver - searches multiple directories for .dat/.ldr/.mpd files
Route::get('/ldraw/{path}', function ($path) {
    // Extract just the filename
    $fileName = basename($path);

    // Search paths in order of likelihood
    $searchPaths = [
        // Direct paths
        "ldraw/parts/{$fileName}",
        "ldraw/p/{$fileName}",
        "ldraw/models/{$fileName}",
        "ldraw/{$fileName}",
        // Subparts (s/ folder inside parts)
        "ldraw/parts/s/{$fileName}",
        // High-res primitives (48/ folder inside p)
        "ldraw/p/48/{$fileName}",
        // Low-res primitives (8/ folder inside p)
        "ldraw/p/8/{$fileName}",
        // If path contains subdirectories, try the full path
        "ldraw/{$path}",
    ];

    foreach ($searchPaths as $searchPath) {
        $fullPath = public_path($searchPath);
        if (file_exists($fullPath)) {
            // Read the file content and strip BOM (Byte Order Mark) characters
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

    abort(404, "LDraw file not found: {$fileName}");
})->where('path', '.*\.(dat|ldr|mpd)$');

Route::get('/', function () {
    return Inertia::render('Home');
});

// Catch-all route for SPA - allows client-side routing if needed
// Excludes API routes, static files (.dat, .ldr, .mpd, etc.), and the ldraw folder
Route::get('/{any}', function () {
    return Inertia::render('Home');
})->where('any', '^(?!api|ldraw)(?!.*\.(dat|ldr|mpd|js|css|png|jpg|svg|ico|woff2?|ttf)).*$');
