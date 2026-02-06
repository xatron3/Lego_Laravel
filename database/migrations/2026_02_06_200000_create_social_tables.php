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
    // User follows
    Schema::create('follows', function (Blueprint $table) {
      $table->id();
      $table->foreignId('follower_id')->constrained('users')->cascadeOnDelete();
      $table->foreignId('following_id')->constrained('users')->cascadeOnDelete();
      $table->timestamps();

      $table->unique(['follower_id', 'following_id']);
      $table->index('following_id');
    });

    // User posts (polymorphic-ready with 'type' column)
    Schema::create('posts', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete();
      $table->string('type')->default('build'); // 'build', future: 'review', 'question', etc.
      $table->string('title')->nullable();
      $table->text('body')->nullable(); // max 500 words enforced at app level
      $table->json('metadata')->nullable(); // flexible data per post type
      $table->timestamps();

      $table->index(['user_id', 'created_at']);
      $table->index(['type', 'created_at']);
    });

    // Post images
    Schema::create('post_images', function (Blueprint $table) {
      $table->id();
      $table->foreignId('post_id')->constrained()->cascadeOnDelete();
      $table->string('path');
      $table->string('filename')->nullable();
      $table->integer('sort_order')->default(0);
      $table->timestamps();

      $table->index('post_id');
    });

    // Likes (polymorphic)
    Schema::create('likes', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete();
      $table->morphs('likeable'); // likeable_type, likeable_id
      $table->timestamps();

      $table->unique(['user_id', 'likeable_type', 'likeable_id']);
    });

    // Comments (polymorphic, nestable)
    Schema::create('comments', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->cascadeOnDelete();
      $table->morphs('commentable'); // commentable_type, commentable_id
      $table->foreignId('parent_id')->nullable()->constrained('comments')->cascadeOnDelete();
      $table->text('body');
      $table->timestamps();

      $table->index('parent_id');
    });

    // Add bio and username to users
    Schema::table('users', function (Blueprint $table) {
      $table->string('username')->nullable()->unique()->after('name');
      $table->text('bio')->nullable()->after('avatar');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('users', function (Blueprint $table) {
      $table->dropColumn(['username', 'bio']);
    });

    Schema::dropIfExists('comments');
    Schema::dropIfExists('likes');
    Schema::dropIfExists('post_images');
    Schema::dropIfExists('posts');
    Schema::dropIfExists('follows');
  }
};
