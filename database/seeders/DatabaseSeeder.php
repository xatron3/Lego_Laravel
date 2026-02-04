<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
  use WithoutModelEvents;

  /**
   * Seed the application's database.
   */
  public function run(): void
  {
    // Create admin user for development/testing
    User::firstOrCreate(
      ['email' => 'admin@example.com'],
      [
        'name' => 'Admin User',
        'password' => bcrypt('password'),
        'role' => 'admin',
      ]
    );

    // Create normal test user
    User::firstOrCreate(
      ['email' => 'test@example.com'],
      [
        'name' => 'Test User',
        'password' => bcrypt('password'),
        'role' => 'normal',
      ]
    );
  }
}
