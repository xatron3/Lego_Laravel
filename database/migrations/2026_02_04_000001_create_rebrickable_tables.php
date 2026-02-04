<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates all Rebrickable data tables in the correct order for foreign key constraints.
     */
    public function up(): void
    {
        // 1. Themes (self-referencing, create first)
        Schema::create('themes', function (Blueprint $table) {
            $table->unsignedInteger('id')->primary();
            $table->string('name', 40);
            $table->unsignedInteger('parent_id')->nullable();
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('themes')->onDelete('set null');
            $table->index('parent_id');
        });

        // 2. Colors
        Schema::create('colors', function (Blueprint $table) {
            $table->integer('id')->primary();
            $table->string('name', 200);
            $table->string('rgb', 6);
            $table->boolean('is_trans')->default(false);
            $table->timestamps();
        });

        // 3. Part Categories
        Schema::create('part_categories', function (Blueprint $table) {
            $table->unsignedInteger('id')->primary();
            $table->string('name', 200);
            $table->timestamps();
        });

        // 4. Parts (depends on part_categories)
        Schema::create('parts', function (Blueprint $table) {
            $table->string('part_num', 20)->primary();
            $table->string('name', 250);
            $table->unsignedInteger('part_cat_id');
            $table->timestamps();

            $table->foreign('part_cat_id')->references('id')->on('part_categories')->onDelete('cascade');
            $table->index('part_cat_id');
            $table->index('name');
        });

        // 5. Minifigs
        Schema::create('minifigs', function (Blueprint $table) {
            $table->string('fig_num', 20)->primary();
            $table->string('name', 256);
            $table->unsignedInteger('num_parts')->default(0);
            $table->timestamps();

            $table->index('name');
        });

        // 6. Sets (depends on themes)
        Schema::create('sets', function (Blueprint $table) {
            $table->string('set_num', 20)->primary();
            $table->string('name', 256);
            $table->unsignedSmallInteger('year');
            $table->unsignedInteger('theme_id');
            $table->unsignedInteger('num_parts')->default(0);
            $table->timestamps();

            $table->foreign('theme_id')->references('id')->on('themes')->onDelete('cascade');
            $table->index('theme_id');
            $table->index('year');
            $table->index('name');
        });

        // 7. Inventories (depends on sets)
        Schema::create('inventories', function (Blueprint $table) {
            $table->unsignedInteger('id')->primary();
            $table->unsignedTinyInteger('version')->default(1);
            $table->string('set_num', 20);
            $table->timestamps();

            $table->foreign('set_num')->references('set_num')->on('sets')->onDelete('cascade');
            $table->index('set_num');
        });

        // 8. Elements (depends on parts and colors)
        Schema::create('elements', function (Blueprint $table) {
            $table->string('element_id', 20)->primary();
            $table->string('part_num', 20);
            $table->integer('color_id');
            $table->timestamps();

            $table->foreign('part_num')->references('part_num')->on('parts')->onDelete('cascade');
            $table->foreign('color_id')->references('id')->on('colors')->onDelete('cascade');
            $table->index('part_num');
            $table->index('color_id');
        });

        // 9. Part Relationships (depends on parts)
        Schema::create('part_relationships', function (Blueprint $table) {
            $table->id();
            $table->string('rel_type', 1);
            $table->string('child_part_num', 20);
            $table->string('parent_part_num', 20);
            $table->timestamps();

            $table->foreign('child_part_num')->references('part_num')->on('parts')->onDelete('cascade');
            $table->foreign('parent_part_num')->references('part_num')->on('parts')->onDelete('cascade');
            $table->index('child_part_num');
            $table->index('parent_part_num');
            $table->index('rel_type');
        });

        // 10. Inventory Parts (depends on inventories, parts, colors)
        Schema::create('inventory_parts', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('inventory_id');
            $table->string('part_num', 20);
            $table->integer('color_id');
            $table->unsignedInteger('quantity')->default(1);
            $table->boolean('is_spare')->default(false);
            $table->timestamps();

            $table->foreign('inventory_id')->references('id')->on('inventories')->onDelete('cascade');
            $table->foreign('part_num')->references('part_num')->on('parts')->onDelete('cascade');
            $table->foreign('color_id')->references('id')->on('colors')->onDelete('cascade');
            $table->index('inventory_id');
            $table->index('part_num');
            $table->index('color_id');
        });

        // 11. Inventory Minifigs (depends on inventories and minifigs)
        Schema::create('inventory_minifigs', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('inventory_id');
            $table->string('fig_num', 20);
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();

            $table->foreign('inventory_id')->references('id')->on('inventories')->onDelete('cascade');
            $table->foreign('fig_num')->references('fig_num')->on('minifigs')->onDelete('cascade');
            $table->index('inventory_id');
            $table->index('fig_num');
        });

        // 12. Inventory Sets (depends on inventories and sets)
        Schema::create('inventory_sets', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('inventory_id');
            $table->string('set_num', 20);
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();

            $table->foreign('inventory_id')->references('id')->on('inventories')->onDelete('cascade');
            $table->foreign('set_num')->references('set_num')->on('sets')->onDelete('cascade');
            $table->index('inventory_id');
            $table->index('set_num');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop in reverse order to respect foreign key constraints
        Schema::dropIfExists('inventory_sets');
        Schema::dropIfExists('inventory_minifigs');
        Schema::dropIfExists('inventory_parts');
        Schema::dropIfExists('part_relationships');
        Schema::dropIfExists('elements');
        Schema::dropIfExists('inventories');
        Schema::dropIfExists('sets');
        Schema::dropIfExists('minifigs');
        Schema::dropIfExists('parts');
        Schema::dropIfExists('part_categories');
        Schema::dropIfExists('colors');
        Schema::dropIfExists('themes');
    }
};
