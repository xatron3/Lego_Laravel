<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    // SQLite doesn't support dropping foreign keys - they're ignored
    if (DB::getDriverName() !== 'sqlite') {
      Schema::table('inventories', function (Blueprint $table) {
        $table->dropForeign('inventories_set_num_foreign');
      });
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('inventories', function (Blueprint $table) {
      $table->foreign('set_num')
        ->references('set_num')
        ->on('sets')
        ->onDelete('cascade');
    });
  }
};
