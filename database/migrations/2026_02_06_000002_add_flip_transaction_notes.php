<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    // Activity notes / log on a transaction
    Schema::create('flip_transaction_notes', function (Blueprint $table) {
      $table->id();
      $table->foreignId('flip_transaction_id')->constrained()->onDelete('cascade');
      $table->text('content');
      $table->timestamps();

      $table->index('flip_transaction_id');
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('flip_transaction_notes');
  }
};
