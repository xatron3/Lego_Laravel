<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\GoogleController;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
|
| Google OAuth routes. API auth routes (login, register, logout) are
| defined in routes/api.php to inherit the API middleware group which
| provides session and cookie support via Sanctum.
|
*/

// Google OAuth Routes - need web middleware for session/redirect support
Route::middleware('web')->group(function () {
    Route::get('/auth/google', [GoogleController::class, 'redirect'])->name('auth.google');
    Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('auth.google.callback');
});
