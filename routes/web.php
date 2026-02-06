<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Web Routes
|--------------------------------------------------------------------------
|
| SEO-optimized routes for the public-facing pages of the application.
| Authentication, admin, catalog, and LDraw routes are organized in
| separate files for better maintainability.
|
*/


/*
|--------------------------------------------------------------------------
| Homepage
|--------------------------------------------------------------------------
*/

Route::get('/', [App\Http\Controllers\PageController::class, 'welcome'])->name('home');

/*
|--------------------------------------------------------------------------
| Store & Model Routes (SEO-Optimized)
|--------------------------------------------------------------------------
*/

// Store - browse and purchase MOC models
Route::get('/store', [App\Http\Controllers\PageController::class, 'store'])->name('store');

// SEO-friendly model detail page: /mocs/{slug}-{id}
// Examples: /mocs/millennium-falcon-75192, /mocs/custom-castle-12345
Route::get('/mocs/{slug}', function ($slug) {
    // Extract ID from slug (assuming format: "name-name-{id}")
    $parts = explode('-', $slug);
    $id = end($parts);

    // Validate ID is numeric
    if (!is_numeric($id)) {
        abort(404);
    }

    return Inertia::render('ModelDetail', ['id' => $id]);
})->where('slug', '[a-z0-9\-]+')->name('moc.show');

/*
|--------------------------------------------------------------------------
| 3D Viewer Routes
|--------------------------------------------------------------------------
*/

// Viewer - 3D model viewer
Route::get('/viewer', function () {
    return Inertia::render('Viewer');
})->name('viewer');

// Viewer with specific model (SEO-friendly slug)
Route::get('/viewer/{slug}', function ($slug) {
    $parts = explode('-', $slug);
    $id = end($parts);

    if (!is_numeric($id)) {
        abort(404);
    }

    return Inertia::render('Viewer', ['modelId' => $id]);
})->where('slug', '[a-z0-9\-]+')->name('viewer.model');

// Pro subscription promo page
Route::get('/pro', [App\Http\Controllers\PageController::class, 'pro'])->name('pro');

/*
|--------------------------------------------------------------------------
| Legal & Information Pages
|--------------------------------------------------------------------------
*/

Route::get('/privacy', function () {
    return Inertia::render('Privacy');
})->name('privacy');

Route::get('/terms', function () {
    return Inertia::render('Terms');
})->name('terms');

Route::get('/about', function () {
    return Inertia::render('About');
})->name('about');

/*
|--------------------------------------------------------------------------
| User Dashboard Routes
|--------------------------------------------------------------------------
*/

// Login page - for unauthenticated users
Route::get('/login', function () {
    return Inertia::render('Login');
})->name('login');

// Dashboard - user profile and model management
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->name('dashboard');

// Dashboard sub-pages (requires auth)
Route::middleware(['auth'])->prefix('dashboard')->group(function () {
    Route::get('/my-models', [App\Http\Controllers\DashboardController::class, 'myModels'])->name('dashboard.my-models');
    Route::get('/submit', [App\Http\Controllers\DashboardController::class, 'submit'])->name('dashboard.submit');
    Route::get('/sales', [App\Http\Controllers\DashboardController::class, 'sales'])->name('dashboard.sales');
    Route::get('/settings', [App\Http\Controllers\DashboardController::class, 'settings'])->name('dashboard.settings');

    // Flipping tracker
    Route::get('/flipping', [App\Http\Controllers\FlippingPageController::class, 'index'])->name('dashboard.flipping');
    Route::get('/flipping/{id}', [App\Http\Controllers\FlippingPageController::class, 'show'])
        ->where('id', '[0-9]+')
        ->name('dashboard.flipping.show');
});

// Cart - shopping cart
Route::get('/cart', function () {
    return Inertia::render('Cart');
})->name('cart');

// Checkout success page
Route::get('/checkout/success', function () {
    return Inertia::render('CheckoutSuccess');
})->name('checkout.success');

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

// Admin Panel Pages - requires authentication and admin role
Route::prefix('admin')->middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('AdminDashboard');
    })->name('admin.dashboard');

    Route::get('/users', function () {
        return Inertia::render('AdminUsers');
    })->name('admin.users');

    Route::get('/models', function () {
        return Inertia::render('AdminModels');
    })->name('admin.models');

    Route::get('/sales', function () {
        return Inertia::render('AdminSales');
    })->name('admin.sales');

    Route::get('/data-import', function () {
        return Inertia::render('AdminDataImport');
    })->name('admin.data-import');

    Route::get('/site-settings', function () {
        return Inertia::render('AdminSiteSettings');
    })->name('admin.site-settings');

    Route::get('/catalog', function () {
        return Inertia::render('AdminCatalog');
    })->name('admin.catalog');
});

/*
|--------------------------------------------------------------------------
| Fallback Route for SPA Client-Side Routing
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Fallback Route for SPA Client-Side Routing
|--------------------------------------------------------------------------
*/

// Catch-all route for SPA - allows client-side routing if needed
// Excludes defined routes, API, admin, catalog, static files, and ldraw folder
Route::get('/{any}', function () {
    return Inertia::render('Welcome');
})->where('any', '^(?!api|ldraw|admin|catalog|store|mocs|viewer|dashboard|cart|checkout|auth|flipping|community|u|privacy|terms|about/)(?!.*\.(dat|ldr|mpd|js|css|png|jpg|svg|ico|woff2?|ttf)).*$');
