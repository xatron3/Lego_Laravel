<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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
    } catch (Exception $e) {
      Log::warning('Google OAuth failed', ['error' => $e->getMessage()]);
      return redirect('/login')->with('error', 'Failed to authenticate with Google. Please try again.');
    }

    $email = $googleUser->getEmail();

    if (!$email || !\filter_var($email, \FILTER_VALIDATE_EMAIL)) {
      return redirect('/login')->with('error', 'Unable to retrieve email from Google.');
    }

    // Prioritize finding by Google ID, then fall back to email
    $user = User::where('google_id', $googleUser->getId())->first()
      ?? User::where('email', $email)->first();

    if ($user) {
      // Link Google account and update avatar
      $user->update([
        'google_id' => $googleUser->getId(),
        'avatar' => $googleUser->getAvatar() ?? $user->avatar,
      ]);
    } else {
      // Create new user
      $user = User::create([
        'name' => $googleUser->getName(),
        'email' => $email,
        'google_id' => $googleUser->getId(),
        'avatar' => $googleUser->getAvatar(),
        'password' => null,
      ]);
    }

    Auth::login($user, true);

    // Regenerate session to prevent session fixation attacks
    request()->session()->regenerate();

    return redirect()->intended('/');
  }
}
