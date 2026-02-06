<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FlippingPageController;
use App\Http\Controllers\Api\FlipController;

/*
|--------------------------------------------------------------------------
| Flipping Routes
|--------------------------------------------------------------------------
|
| Routes for the LEGO Flipping system - buy/sell tracking, matching,
| and profit analytics.
|
| NOTE: The Inertia page routes are now in web.php under /dashboard/flipping
*/

// API Routes (requires auth) - Accept both web session and Sanctum token auth
Route::prefix('api/flipping')
  ->middleware(['api', 'auth:sanctum,web'])
  ->group(function () {
    // Transactions CRUD
    Route::get('/', [FlipController::class, 'index']);
    Route::post('/', [FlipController::class, 'store']);
    Route::get('/{id}', [FlipController::class, 'show'])->where('id', '[0-9]+');
    Route::put('/{id}', [FlipController::class, 'update'])->where('id', '[0-9]+');
    Route::delete('/{id}', [FlipController::class, 'destroy'])->where('id', '[0-9]+');

    // Sub-sells (sales attached to a buy)
    Route::post('/{id}/sub-sell', [FlipController::class, 'storeSubSell'])->where('id', '[0-9]+');

    // Status management
    Route::post('/{id}/complete', [FlipController::class, 'complete'])->where('id', '[0-9]+');
    Route::post('/{id}/reopen', [FlipController::class, 'reopen'])->where('id', '[0-9]+');

    // Transaction notes
    Route::post('/{id}/notes', [FlipController::class, 'addNote'])->where('id', '[0-9]+');
    Route::delete('/{transactionId}/notes/{noteId}', [FlipController::class, 'deleteNote'])
      ->where('transactionId', '[0-9]+')
      ->where('noteId', '[0-9]+');

    // Matching
    Route::get('/{id}/candidates', [FlipController::class, 'matchCandidates'])->where('id', '[0-9]+');
    Route::post('/matches', [FlipController::class, 'createMatch']);
    Route::delete('/matches/{id}', [FlipController::class, 'deleteMatch'])->where('id', '[0-9]+');

    // Stats & helpers
    Route::get('/stats', [FlipController::class, 'stats']);
    Route::get('/platforms', [FlipController::class, 'platforms']);
  });
