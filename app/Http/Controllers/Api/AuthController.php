<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
  /**
   * Get the currently authenticated user.
   */
  public function user(Request $request): JsonResponse
  {
    $user = Auth::user();

    if (!$user) {
      return response()->json(null);
    }

    return response()->json([
      'id' => $user->id,
      'name' => $user->name,
      'email' => $user->email,
      'role' => $user->role->value ?? 'normal',
      'avatar' => $user->avatar,
      'created_at' => $user->created_at,
    ]);
  }

  /**
   * Register a new user.
   */
  public function register(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'name' => ['required', 'string', 'max:255'],
      'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
      'password' => ['required', 'confirmed', Password::defaults()],
    ]);

    $user = User::create([
      'name' => $validated['name'],
      'email' => $validated['email'],
      'password' => Hash::make($validated['password']),
    ]);

    Auth::login($user);

    return response()->json([
      'id' => $user->id,
      'name' => $user->name,
      'email' => $user->email,
      'role' => $user->role->value ?? 'normal',
      'avatar' => $user->avatar,
    ], 201);
  }

  /**
   * Login with email and password.
   */
  public function login(Request $request): JsonResponse
  {
    $credentials = $request->validate([
      'email' => ['required', 'string', 'email'],
      'password' => ['required', 'string'],
    ]);

    if (!Auth::attempt($credentials, $request->boolean('remember'))) {
      throw ValidationException::withMessages([
        'email' => ['The provided credentials are incorrect.'],
      ]);
    }

    $request->session()->regenerate();

    $user = Auth::user();

    return response()->json([
      'id' => $user->id,
      'name' => $user->name,
      'email' => $user->email,
      'role' => $user->role->value ?? 'normal',
      'avatar' => $user->avatar,
    ]);
  }

  /**
   * Logout the current user.
   */
  public function logout(Request $request): JsonResponse
  {
    // Logout from both guards to ensure complete logout
    Auth::guard('web')->logout();
    
    // Also revoke all Sanctum tokens if any exist
    if ($request->user()) {
      $request->user()->tokens()->delete();
    }

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json(['message' => 'Logged out successfully']);
  }
}
