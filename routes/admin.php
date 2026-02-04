<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\RebrickableController;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Admin Routes (Non-API)
|--------------------------------------------------------------------------
|
| This file is intentionally kept minimal. Admin Inertia page routes are
| in web.php and admin API routes are in api.php to ensure they get the
| proper middleware stacks.
|
*/

// All admin routes have been moved:
// - Inertia page routes -> web.php (for proper web middleware)
// - API routes -> api.php (for proper API middleware including sessions)
