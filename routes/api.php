<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\LegoModelController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\RebrickableController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\MocSetController;

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
| Public Catalog Routes (Rebrickable Data)
|--------------------------------------------------------------------------
*/

Route::prefix('catalog')->group(function () {
  Route::get('/stats', [CatalogController::class, 'stats']);
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
  Route::put('lego-models/{id}', [LegoModelController::class, 'update']);
  Route::patch('lego-models/{id}', [LegoModelController::class, 'update']);
  Route::delete('lego-models/{id}', [LegoModelController::class, 'destroy']);

  // Model ownership and claiming
  Route::get('lego-models/{id}/ownership', [LegoModelController::class, 'checkOwnership']);
  Route::post('lego-models/{id}/claim', [LegoModelController::class, 'claim']);
  Route::delete('lego-models/{id}/claim', [LegoModelController::class, 'unclaim']);

  // Model thumbnail
  Route::post('lego-models/{id}/thumbnail', [LegoModelController::class, 'uploadThumbnail']);

  // MOC management routes
  Route::post('mocs', [MocSetController::class, 'store']);
  Route::put('mocs/{setNum}', [MocSetController::class, 'update']);
  Route::delete('mocs/{setNum}', [MocSetController::class, 'destroy']);

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

  // Rebrickable Data Management
  Route::prefix('rebrickable')->group(function () {
    Route::get('/stats', [RebrickableController::class, 'stats']);
    Route::get('/tables', [RebrickableController::class, 'tables']);
    Route::post('/import-all', [RebrickableController::class, 'importAllFromServer']);
    Route::post('/clear-all', [RebrickableController::class, 'clearAll']);
    Route::post('/{table}/import', [RebrickableController::class, 'import']);
    Route::post('/{table}/import-server', [RebrickableController::class, 'importFromServer']);
    Route::post('/{table}/clear', [RebrickableController::class, 'clear']);
    Route::get('/{table}', [RebrickableController::class, 'index']);
    Route::post('/{table}', [RebrickableController::class, 'store']);
    Route::get('/{table}/{id}', [RebrickableController::class, 'show']);
    Route::put('/{table}/{id}', [RebrickableController::class, 'update']);
    Route::delete('/{table}/{id}', [RebrickableController::class, 'destroy']);
  });
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
