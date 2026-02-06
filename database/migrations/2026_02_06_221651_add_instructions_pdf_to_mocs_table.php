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
    Schema::table('mocs', function (Blueprint $table) {
      $table->string('instructions_pdf')->nullable()->after('file_name');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('mocs', function (Blueprint $table) {
      $table->dropColumn('instructions_pdf');
    });
  }
};
