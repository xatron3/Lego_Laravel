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
   * Format user data for API responses.
   * Matches the shape shared by HandleInertiaRequests for consistency.
   */
  private function formatUserData(User $user): array
  {
    return [
      'id' => $user->id,
      'name' => $user->name,
      'username' => $user->username,
      'email' => $user->email,
      'role' => $user->role,
      'avatar' => $user->avatar,
      'bio' => $user->bio,
      'is_pro' => $user->isPro(),
      'pro_expires_at' => $user->pro_expires_at?->toISOString(),
      'created_at' => $user->created_at?->toISOString(),
      'settings' => $user->settings ?? [],
    ];
  }

  /**
   * Get the currently authenticated user.
   */
  public function user(Request $request): JsonResponse
  {
    $user = $request->user();

    if (!$user) {
      return response()->json(null, 401);
    }

    return response()->json($this->formatUserData($user));
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

    // Regenerate session for security (prevent session fixation)
    $request->session()->regenerate();

    return response()->json([
      'user' => $this->formatUserData($user),
      'message' => 'Registration successful.',
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

    return response()->json([
      'user' => $this->formatUserData(Auth::user()),
      'message' => 'Login successful.',
    ]);
  }

  /**
   * Logout the current user.
   */
  public function logout(Request $request): JsonResponse
  {
    // Use the web (session) guard — Sanctum's guard has no logout()
    Auth::guard('web')->logout();

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json(['message' => 'Logged out successfully']);
  }
}
