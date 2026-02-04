<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Increase name column sizes to accommodate longer names from Rebrickable data.
     */
    public function up(): void
    {
        // Increase themes name from 40 to 200
        Schema::table('themes', function (Blueprint $table) {
            $table->string('name', 200)->change();
        });

        // Increase part_categories name to 255
        Schema::table('part_categories', function (Blueprint $table) {
            $table->string('name', 255)->change();
        });

        // Increase colors name to 255
        Schema::table('colors', function (Blueprint $table) {
            $table->string('name', 255)->change();
        });

        // Increase parts name to 500 (some part names are very long)
        Schema::table('parts', function (Blueprint $table) {
            $table->string('name', 500)->change();
        });

        // Increase minifigs name to 500
        Schema::table('minifigs', function (Blueprint $table) {
            $table->string('name', 500)->change();
        });

        // Increase sets name to 500
        Schema::table('sets', function (Blueprint $table) {
            $table->string('name', 500)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('themes', function (Blueprint $table) {
            $table->string('name', 40)->change();
        });

        Schema::table('part_categories', function (Blueprint $table) {
            $table->string('name', 200)->change();
        });

        Schema::table('colors', function (Blueprint $table) {
            $table->string('name', 200)->change();
        });

        Schema::table('parts', function (Blueprint $table) {
            $table->string('name', 250)->change();
        });

        Schema::table('minifigs', function (Blueprint $table) {
            $table->string('name', 256)->change();
        });

        Schema::table('sets', function (Blueprint $table) {
            $table->string('name', 256)->change();
        });
    }
};
