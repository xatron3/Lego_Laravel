<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add img_url columns to sets, minifigs, and inventory_parts tables.
     */
    public function up(): void
    {
        Schema::table('sets', function (Blueprint $table) {
            $table->string('img_url', 500)->nullable()->after('num_parts');
        });

        Schema::table('minifigs', function (Blueprint $table) {
            $table->string('img_url', 500)->nullable()->after('num_parts');
        });

        Schema::table('inventory_parts', function (Blueprint $table) {
            $table->string('img_url', 500)->nullable()->after('is_spare');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sets', function (Blueprint $table) {
            $table->dropColumn('img_url');
        });

        Schema::table('minifigs', function (Blueprint $table) {
            $table->dropColumn('img_url');
        });

        Schema::table('inventory_parts', function (Blueprint $table) {
            $table->dropColumn('img_url');
        });
    }
};
