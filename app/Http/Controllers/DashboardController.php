<?php

namespace App\Http\Controllers;

use App\Models\Moc;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Handles Inertia page rendering for the user dashboard.
 */
class DashboardController extends Controller
{
  /**
   * Show the my models page.
   */
  public function myModels(Request $request): Response
  {
    $user = $request->user();
    $filter = $request->get('filter', 'all');

    $query = Moc::query();

    switch ($filter) {
      case 'created':
        $query->where('user_id', $user->id);
        break;
      case 'owned':
        $query->whereHas('owners', function ($q) use ($user) {
          $q->where('users.id', $user->id);
        })->where('user_id', '!=', $user->id);
        break;
      default:
        // All: created or owned
        $query->where(function ($q) use ($user) {
          $q->where('user_id', $user->id)
            ->orWhereHas('owners', function ($subQ) use ($user) {
              $subQ->where('users.id', $user->id);
            });
        });
    }

    $models = $query->orderByDesc('created_at')->get();

    // Add ownership_type for owned models
    $models->transform(function ($model) use ($user) {
      if ($model->user_id !== $user->id) {
        $model->ownership_type = 'claimed';
      }
      return $model;
    });

    return Inertia::render('Dashboard/MyModels', [
      'models' => $models,
      'filter' => $filter,
    ]);
  }

  /**
   * Show the submit model page.
   */
  public function submit(Request $request): Response
  {
    return Inertia::render('Dashboard/Submit');
  }

  /**
   * Show the sales analytics page.
   */
  public function sales(Request $request): Response
  {
    return Inertia::render('Dashboard/Sales');
  }

  /**
   * Show the settings page.
   */
  public function settings(Request $request): Response
  {
    return Inertia::render('Dashboard/Settings');
  }
}
