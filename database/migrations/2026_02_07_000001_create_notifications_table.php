<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::create('notifications', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete();
      $table->string('type'); // new_follower, post_like, moc_sale, post_comment
      $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
      $table->nullableMorphs('notifiable'); // the related entity (post, moc, comment, etc.)
      $table->json('data')->nullable(); // extra context (message preview, amount, etc.)
      $table->timestamps();

      $table->index(['user_id', 'created_at']);
    });

    // Track the last notification the user has seen
    Schema::table('users', function (Blueprint $table) {
      $table->unsignedBigInteger('last_seen_notification_id')->nullable()->after('settings');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('notifications');

    Schema::table('users', function (Blueprint $table) {
      $table->dropColumn('last_seen_notification_id');
    });
  }
};
