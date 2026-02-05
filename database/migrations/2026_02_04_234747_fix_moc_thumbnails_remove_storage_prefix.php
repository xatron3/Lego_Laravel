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
    // Remove /storage/ prefix from moc thumbnails
    DB::table('mocs')
      ->whereNotNull('thumbnail')
      ->where('thumbnail', 'like', '/storage/%')
      ->update([
        'thumbnail' => DB::raw("REPLACE(thumbnail, '/storage/', '')")
      ]);
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    // Add /storage/ prefix back to moc thumbnails
    DB::table('mocs')
      ->whereNotNull('thumbnail')
      ->whereNotLike('thumbnail', '/storage/%')
      ->update([
        'thumbnail' => DB::raw("CONCAT('/storage/', thumbnail)")
      ]);
  }
};
