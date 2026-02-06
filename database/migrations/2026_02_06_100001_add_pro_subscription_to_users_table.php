<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::table('users', function (Blueprint $table) {
      $table->boolean('is_pro')->default(false)->after('role');
      $table->timestamp('pro_expires_at')->nullable()->after('is_pro');
      $table->string('stripe_customer_id')->nullable()->after('pro_expires_at');
      $table->string('stripe_subscription_id')->nullable()->after('stripe_customer_id');
    });
  }

  public function down(): void
  {
    Schema::table('users', function (Blueprint $table) {
      $table->dropColumn(['is_pro', 'pro_expires_at', 'stripe_customer_id', 'stripe_subscription_id']);
    });
  }
};
