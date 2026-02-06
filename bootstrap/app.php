<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
  ->withRouting(
    web: __DIR__ . '/../routes/web.php',
    api: __DIR__ . '/../routes/api.php',
    commands: __DIR__ . '/../routes/console.php',
    health: '/up',
    then: function () {
      // Load additional route files for better organization
      require __DIR__ . '/../routes/auth.php';
      require __DIR__ . '/../routes/admin.php';
      require __DIR__ . '/../routes/catalog.php';
      require __DIR__ . '/../routes/ldraw.php';
      require __DIR__ . '/../routes/flipping.php';
      require __DIR__ . '/../routes/community.php';
    },
  )
  ->withMiddleware(function (Middleware $middleware): void {
    $middleware->web(append: [
      \App\Http\Middleware\HandleInertiaRequests::class,
    ]);

    // Apply session middleware to API routes for Sanctum SPA authentication
    // Sanctum's EnsureFrontendRequestsAreStateful will handle CSRF validation
    $middleware->group('api', [
      \Illuminate\Cookie\Middleware\EncryptCookies::class,
      \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
      \Illuminate\Session\Middleware\StartSession::class,
      \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    ]);

    // Exclude XSRF-TOKEN from encryption so JavaScript can read it
    $middleware->encryptCookies(except: [
      'XSRF-TOKEN',
    ]);

    $middleware->alias([
      'role' => \App\Http\Middleware\CheckRole::class,
    ]);
  })
  ->withExceptions(function (Exceptions $exceptions): void {
    //
  })->create();
