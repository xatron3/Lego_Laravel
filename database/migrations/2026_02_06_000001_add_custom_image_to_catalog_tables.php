<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  /**
   * Add custom_image column to sets, parts, minifigs, and themes tables.
   * Custom images override the default Rebrickable CDN images.
   */
  public function up(): void
  {
    Schema::table('sets', function (Blueprint $table) {
      $table->string('custom_image')->nullable()->after('num_parts');
    });

    Schema::table('parts', function (Blueprint $table) {
      $table->string('custom_image')->nullable()->after('part_cat_id');
    });

    Schema::table('minifigs', function (Blueprint $table) {
      $table->string('custom_image')->nullable()->after('num_parts');
    });

    Schema::table('themes', function (Blueprint $table) {
      $table->string('custom_image')->nullable()->after('parent_id');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('sets', function (Blueprint $table) {
      $table->dropColumn('custom_image');
    });

    Schema::table('parts', function (Blueprint $table) {
      $table->dropColumn('custom_image');
    });

    Schema::table('minifigs', function (Blueprint $table) {
      $table->dropColumn('custom_image');
    });

    Schema::table('themes', function (Blueprint $table) {
      $table->dropColumn('custom_image');
    });
  }
};
