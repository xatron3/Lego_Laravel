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
    Schema::create('moc_sets', function (Blueprint $table) {
      $table->string('set_num', 20)->primary();
      $table->string('name', 256);
      $table->text('description')->nullable();
      $table->unsignedSmallInteger('year');
      $table->unsignedInteger('theme_id');
      $table->unsignedInteger('num_parts')->default(0);

      // MOC-specific fields
      $table->longText('ldr_content');
      $table->string('file_name')->nullable();
      $table->integer('total_steps')->default(0);
      $table->decimal('price', 10, 2)->nullable();
      $table->boolean('is_public')->default(true);
      $table->string('thumbnail')->nullable();
      $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');

      $table->timestamps();

      $table->foreign('theme_id')->references('id')->on('themes')->onDelete('cascade');
      $table->index('theme_id');
      $table->index('year');
      $table->index('name');
      $table->index('user_id');
      $table->index('is_public');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('moc_sets');
  }
};
