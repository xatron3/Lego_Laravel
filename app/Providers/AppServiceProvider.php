<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use App\Models\LegoModel;

class AppServiceProvider extends ServiceProvider
{
  /**
   * Register any application services.
   */
  public function register(): void
  {
    //
  }

  /**
   * Bootstrap any application services.
   */
  public function boot(): void
  {
    Route::bind('legoModel', function (string $value) {
      file_put_contents(storage_path('logs/binding.txt'), "Binding called with value: $value\n", FILE_APPEND);
      return LegoModel::findOrFail($value);
    });
  }
}
