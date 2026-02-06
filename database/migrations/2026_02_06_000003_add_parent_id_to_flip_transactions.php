<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::table('flip_transactions', function (Blueprint $table) {
      // Parent transaction ID (for sub-transactions/sells attached to a buy)
      $table->foreignId('parent_id')
        ->nullable()
        ->after('user_id')
        ->constrained('flip_transactions')
        ->onDelete('cascade');

      $table->index('parent_id');
    });
  }

  public function down(): void
  {
    Schema::table('flip_transactions', function (Blueprint $table) {
      $table->dropForeign(['parent_id']);
      $table->dropColumn('parent_id');
    });
  }
};
