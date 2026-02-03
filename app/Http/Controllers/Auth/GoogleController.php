<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
  /**
   * Redirect to Google for authentication.
   */
  public function redirect(): RedirectResponse
  {
    return Socialite::driver('google')->redirect();
  }

  /**
   * Handle Google callback.
   */
  public function callback(): RedirectResponse
  {
    try {
      $googleUser = Socialite::driver('google')->user();
    } catch (\Exception $e) {
      return redirect('/')->with('error', 'Failed to authenticate with Google.');
    }

    // Find existing user by Google ID or email
    $user = User::where('google_id', $googleUser->getId())
      ->orWhere('email', $googleUser->getEmail())
      ->first();

    if ($user) {
      // Update Google ID and avatar if not set
      $user->update([
        'google_id' => $googleUser->getId(),
        'avatar' => $googleUser->getAvatar() ?? $user->avatar,
      ]);
    } else {
      // Create new user
      $user = User::create([
        'name' => $googleUser->getName(),
        'email' => $googleUser->getEmail(),
        'google_id' => $googleUser->getId(),
        'avatar' => $googleUser->getAvatar(),
        'password' => null,
      ]);
    }

    Auth::login($user, true);

    return redirect('/')->with('success', 'Successfully logged in with Google!');
  }
}
