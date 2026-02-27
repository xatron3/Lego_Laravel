<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Remove img_url from inventory_parts - using custom CDN pattern instead.
     */
    public function up(): void
    {
        Schema::table('inventory_parts', function (Blueprint $table) {
            $table->dropColumn('img_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_parts', function (Blueprint $table) {
            $table->string('img_url', 500)->nullable()->after('is_spare');
        });
    }
};
