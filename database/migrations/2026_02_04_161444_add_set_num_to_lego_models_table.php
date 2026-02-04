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
    Schema::table('lego_models', function (Blueprint $table) {
      $table->string('set_num', 20)->nullable()->unique()->after('id');
      $table->index('set_num');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('lego_models', function (Blueprint $table) {
      $table->dropIndex(['set_num']);
      $table->dropColumn('set_num');
    });
  }
};
