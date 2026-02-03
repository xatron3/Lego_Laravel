<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
  /**
   * Handle an incoming request.
   *
   * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
   * @param  string  $role  The minimum role required
   */
  public function handle(Request $request, Closure $next, string $role): Response
  {
    if (!$request->user()) {
      if ($request->expectsJson()) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
      }
      return redirect()->route('home');
    }

    $requiredRole = UserRole::tryFrom($role);

    if (!$requiredRole) {
      abort(500, "Invalid role: {$role}");
    }

    if (!$request->user()->hasRole($requiredRole)) {
      if ($request->expectsJson()) {
        return response()->json(['message' => 'Forbidden. Insufficient permissions.'], 403);
      }
      abort(403, 'Insufficient permissions.');
    }

    return $next($request);
  }
}
