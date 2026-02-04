<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Api\AuthController;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
|
| All authentication-related routes including API auth, OAuth, and CSRF.
|
*/

// CSRF Cookie Route (Required for Sanctum SPA Auth)
Route::get('/sanctum/csrf-cookie', function () {
  return response()->json(['message' => 'CSRF cookie set']);
});

// Google OAuth Routes - need web middleware for session support
Route::middleware('web')->group(function () {
  Route::get('/auth/google', [GoogleController::class, 'redirect'])->name('auth.google');
  Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('auth.google.callback');
});

// API Authentication Routes
Route::prefix('api/auth')->group(function () {
  Route::get('/user', [AuthController::class, 'user']);
  Route::post('/register', [AuthController::class, 'register']);
  Route::post('/login', [AuthController::class, 'login']);
  Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});
