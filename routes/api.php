<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LegoModelController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
  Route::get('/user', [AuthController::class, 'user']);
  Route::post('/register', [AuthController::class, 'register']);
  Route::post('/login', [AuthController::class, 'login']);
  Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

/*
|--------------------------------------------------------------------------
| Public Stats Route
|--------------------------------------------------------------------------
*/

Route::get('stats', [StoreController::class, 'stats']);
Route::get('store', [StoreController::class, 'index']);

/*
|--------------------------------------------------------------------------
| LEGO Models API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::get('lego-models', [LegoModelController::class, 'index']);
Route::get('lego-models/{id}', [LegoModelController::class, 'show']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
  Route::get('my-models', [LegoModelController::class, 'myModels']);
  Route::post('lego-models', [LegoModelController::class, 'store']);
  Route::put('lego-models/{legoModel}', [LegoModelController::class, 'update']);
  Route::patch('lego-models/{legoModel}', [LegoModelController::class, 'update']);
  Route::delete('lego-models/{legoModel}', [LegoModelController::class, 'destroy']);

  // Model ownership and claiming
  Route::get('lego-models/{legoModel}/ownership', [LegoModelController::class, 'checkOwnership']);
  Route::post('lego-models/{legoModel}/claim', [LegoModelController::class, 'claim']);

  // Dashboard routes
  Route::get('dashboard/models', [DashboardController::class, 'models']);
  Route::put('user/settings', [DashboardController::class, 'updateSettings']);
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
  Route::get('/stats', [AdminController::class, 'stats']);
  Route::get('/users', [AdminController::class, 'users']);
  Route::patch('/users/{user}/role', [AdminController::class, 'updateUserRole']);
  Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
  Route::get('/models', [AdminController::class, 'models']);
  Route::patch('/models/{legoModel}', [AdminController::class, 'updateModel']);
  Route::delete('/models/{legoModel}', [AdminController::class, 'deleteModel']);
});

/*
|--------------------------------------------------------------------------
| Moderator Routes
|--------------------------------------------------------------------------
*/

Route::prefix('mod')->middleware(['auth:sanctum', 'role:mod'])->group(function () {
  Route::get('/models', [AdminController::class, 'models']);
  Route::patch('/models/{legoModel}', [AdminController::class, 'updateModel']);
});
