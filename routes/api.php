<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MocController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\SellerController;
use App\Http\Controllers\Api\ProSubscriptionController;
use App\Http\Controllers\Api\SiteSettingController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Core API routes for the application. Authentication, admin, and catalog
| routes are organized in separate files (auth.php, admin.php, catalog.php)
| for better maintainability.
|
*/

/*
|--------------------------------------------------------------------------
| Public Stats & Store Routes
|--------------------------------------------------------------------------
*/

Route::get('stats', [StoreController::class, 'stats']);
Route::get('store', [StoreController::class, 'index']);


/*
|--------------------------------------------------------------------------
| Stripe Webhook (no auth required, verified by signature)
|--------------------------------------------------------------------------
*/

Route::post('webhook/stripe', [CheckoutController::class, 'webhook']);
Route::post('webhook/stripe/subscription', [ProSubscriptionController::class, 'webhook']);

/*
|--------------------------------------------------------------------------
| Public MOC Routes
|--------------------------------------------------------------------------
*/

// Public routes for browsing MOCs
Route::get('mocs', [MocController::class, 'index']);
Route::get('mocs/{id}', [MocController::class, 'show']);

// Backward compatibility aliases
Route::get('lego-models', [MocController::class, 'index']);
Route::get('lego-models/{id}', [MocController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Authenticated User Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
  // User's own MOCs
  Route::get('my-mocs', [MocController::class, 'myMocs']);
  Route::post('mocs', [MocController::class, 'store']);
  Route::put('mocs/{id}', [MocController::class, 'update']);
  Route::patch('mocs/{id}', [MocController::class, 'update']);
  Route::delete('mocs/{id}', [MocController::class, 'destroy']);

  // MOC ownership and claiming
  Route::get('mocs/{id}/ownership', [MocController::class, 'checkOwnership']);
  Route::post('mocs/{id}/claim', [MocController::class, 'claim']);
  Route::delete('mocs/{id}/claim', [MocController::class, 'unclaim']);

  // MOC images (up to 8 per MOC)
  Route::post('mocs/{id}/images', [MocController::class, 'uploadImages']);
  Route::delete('mocs/{id}/images/{imageId}', [MocController::class, 'deleteImage']);
  Route::patch('mocs/{id}/images/{imageId}/primary', [MocController::class, 'setPrimaryImage']);
  Route::patch('mocs/{id}/images/reorder', [MocController::class, 'reorderImages']);

  // Backward compatibility aliases for lego-models routes
  Route::get('my-models', [MocController::class, 'myMocs']);
  Route::post('lego-models', [MocController::class, 'store']);
  Route::put('lego-models/{id}', [MocController::class, 'update']);
  Route::patch('lego-models/{id}', [MocController::class, 'update']);
  Route::delete('lego-models/{id}', [MocController::class, 'destroy']);
  Route::get('lego-models/{id}/ownership', [MocController::class, 'checkOwnership']);
  Route::post('lego-models/{id}/claim', [MocController::class, 'claim']);
  Route::delete('lego-models/{id}/claim', [MocController::class, 'unclaim']);
  Route::post('lego-models/{id}/thumbnail', [MocController::class, 'uploadImages']);

  // Dashboard routes
  Route::get('dashboard/models', [DashboardController::class, 'models']);
  Route::put('user/settings', [DashboardController::class, 'updateSettings']);

  // Cart routes
  Route::prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'index']);
    Route::post('/', [CartController::class, 'store']);
    Route::delete('/{id}', [CartController::class, 'destroy']);
    Route::delete('/', [CartController::class, 'clear']);
    Route::get('/count', [CartController::class, 'count']);
    Route::get('/check/{id}', [CartController::class, 'check']);
  });

  // Checkout routes
  Route::prefix('checkout')->group(function () {
    Route::post('/session', [CheckoutController::class, 'createSession']);
    Route::get('/success', [CheckoutController::class, 'success']);
    Route::get('/orders', [CheckoutController::class, 'orders']);
    Route::get('/orders/{id}', [CheckoutController::class, 'show']);
  });

  // Seller analytics routes
  Route::prefix('seller')->group(function () {
    Route::get('/analytics', [SellerController::class, 'analytics']);
    Route::get('/earnings', [SellerController::class, 'earnings']);
  });

  // Pro subscription routes
  Route::prefix('pro')->group(function () {
    Route::get('/status', [ProSubscriptionController::class, 'status']);
    Route::post('/subscribe', [ProSubscriptionController::class, 'subscribe']);
    Route::post('/cancel', [ProSubscriptionController::class, 'cancel']);
    Route::post('/resume', [ProSubscriptionController::class, 'resume']);
  });
});

/*
|--------------------------------------------------------------------------
| Admin & Moderator API Routes
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\RebrickableController;

// Admin API Routes - Accept both web session and Sanctum token auth
Route::prefix('admin')->middleware(['auth:sanctum,web', 'role:admin'])->group(function () {
  // Dashboard stats
  Route::get('/stats', [AdminController::class, 'stats']);
  Route::get('/sales', [AdminController::class, 'sales']);

  // Site settings management
  Route::get('/settings', [SiteSettingController::class, 'index']);
  Route::post('/settings', [SiteSettingController::class, 'store']);
  Route::get('/settings/{key}', [SiteSettingController::class, 'show']);
  Route::put('/settings/{key}', [SiteSettingController::class, 'update']);
  Route::delete('/settings/{key}', [SiteSettingController::class, 'destroy']);

  // User management
  Route::get('/users', [AdminController::class, 'users']);
  Route::patch('/users/{user}/role', [AdminController::class, 'updateUserRole']);
  Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);

  // Model management
  Route::get('/models', [AdminController::class, 'models']);
  Route::patch('/models/{id}', [AdminController::class, 'updateModel']);
  Route::delete('/models/{id}', [AdminController::class, 'deleteModel']);

  // Rebrickable Data Management
  Route::prefix('rebrickable')->group(function () {
    Route::get('/stats', [RebrickableController::class, 'stats']);
    Route::get('/tables', [RebrickableController::class, 'tables']);
    Route::post('/import-all', [RebrickableController::class, 'importAllFromServer']);
    Route::get('/jobs', [RebrickableController::class, 'listJobs']);
    Route::get('/progress/{jobId}', [RebrickableController::class, 'progress']);
    Route::post('/retry/{jobId}', [RebrickableController::class, 'retryJob']);
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

// Moderator API Routes - Accept both web session and Sanctum token auth
Route::prefix('mod')->middleware(['auth:sanctum,web', 'role:mod'])->group(function () {
  Route::get('/models', [AdminController::class, 'models']);
  Route::patch('/models/{id}', [AdminController::class, 'updateModel']);
});
