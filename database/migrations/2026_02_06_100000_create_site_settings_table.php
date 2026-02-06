<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('site_settings', function (Blueprint $table) {
      $table->id();
      $table->string('key')->unique();
      $table->json('content')->nullable();
      $table->string('description')->nullable();
      $table->timestamps();
    });

    // Seed default settings
    DB::table('site_settings')->insert([
      [
        'key' => 'pro_demo_moc_ids',
        'content' => json_encode([]),
        'description' => 'MOC IDs to show as demo models on the Pro promo page',
        'created_at' => now(),
        'updated_at' => now(),
      ],
      [
        'key' => 'free_flip_transaction_limit',
        'content' => json_encode(100),
        'description' => 'Maximum number of flip transactions for free users',
        'created_at' => now(),
        'updated_at' => now(),
      ],
    ]);
  }

  public function down(): void
  {
    Schema::dropIfExists('site_settings');
  }
};
