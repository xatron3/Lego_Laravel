<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration restructures MOCs to:
     * 1. Use the existing `sets` table for catalog data (name, parts count, theme, etc.)
     * 2. Rename `lego_models` to `mocs` for MOC-specific data only
     * 3. Link `mocs` to `sets` via set_num foreign key
     * 4. Remove MOC fields from sets table
     * 5. Drop the redundant moc_sets table
     * 6. Add moc_images table for multiple images per MOC
     */
    public function up(): void
    {
        // Step 1: Remove MOC-specific fields from sets table (if they exist)
        if (Schema::hasColumn('sets', 'is_moc')) {
            // Drop indexes first (required for all databases)
            Schema::table('sets', function (Blueprint $table) {
                try {
                    $table->dropIndex(['is_moc']);
                } catch (\Exception $e) {
                    // Index might not exist
                }
                try {
                    $table->dropIndex(['is_public']);
                } catch (\Exception $e) {
                    // Index might not exist
                }
            });

            // For non-SQLite databases, drop foreign keys
            if (DB::getDriverName() !== 'sqlite') {
                Schema::table('sets', function (Blueprint $table) {
                    try {
                        $table->dropForeign(['user_id']);
                    } catch (\Exception $e) {
                        // Foreign key might not exist
                    }
                    try {
                        $table->dropIndex(['user_id']);
                    } catch (\Exception $e) {
                        // Index might not exist
                    }
                });
            } else {
                // For SQLite, just drop the index (no foreign key constraints)
                Schema::table('sets', function (Blueprint $table) {
                    try {
                        $table->dropIndex(['user_id']);
                    } catch (\Exception $e) {
                        // Index might not exist
                    }
                });
            }

            Schema::table('sets', function (Blueprint $table) {
                // Remove columns that don't belong in sets
                $columns = ['is_moc', 'ldr_content', 'description', 'file_name', 'price', 'is_public', 'thumbnail', 'user_id'];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('sets', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        // Step 2: Drop moc_sets table if it exists
        Schema::dropIfExists('moc_sets');

        // Step 3: Refactor lego_models table
        // First, ensure set_num column exists and is properly structured
        Schema::table('lego_models', function (Blueprint $table) {
            // Add set_num if it doesn't exist (it should from previous migration)
            if (!Schema::hasColumn('lego_models', 'set_num')) {
                $table->string('set_num', 20)->nullable()->after('id');
            }

            // Add total_steps column if missing
            if (!Schema::hasColumn('lego_models', 'total_steps')) {
                $table->integer('total_steps')->default(0)->after('ldr_content');
            }
        });

        // Step 4: Rename lego_models to mocs
        Schema::rename('lego_models', 'mocs');

        // Step 5: Update mocs table structure
        Schema::table('mocs', function (Blueprint $table) {
            // Ensure proper column order and constraints
            // set_num will be the link to sets table

            // Add index on set_num for faster lookups
            $table->index('set_num');
        });

        // Step 6: Create moc_images table for multiple images
        Schema::create('moc_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('moc_id')->constrained('mocs')->onDelete('cascade');
            $table->string('path'); // Storage path
            $table->string('filename')->nullable(); // Original filename
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->index('moc_id');
            $table->index('is_primary');
        });

        // Step 7: Update user_owned_models foreign key to reference mocs
        // First check if the foreign key exists and rename the column
        if (Schema::hasTable('user_owned_models')) {
            // Rename lego_model_id to moc_id
            if (Schema::hasColumn('user_owned_models', 'lego_model_id')) {
                Schema::table('user_owned_models', function (Blueprint $table) {
                    $table->renameColumn('lego_model_id', 'moc_id');
                });
            }
        }

        // Step 8: Update cart_items foreign key reference
        if (Schema::hasTable('cart_items')) {
            // Rename lego_model_id to moc_id
            if (Schema::hasColumn('cart_items', 'lego_model_id')) {
                Schema::table('cart_items', function (Blueprint $table) {
                    $table->renameColumn('lego_model_id', 'moc_id');
                });
            }
        }

        // Step 9: Update order_items foreign key reference
        if (Schema::hasTable('order_items')) {
            // Rename lego_model_id to moc_id
            if (Schema::hasColumn('order_items', 'lego_model_id')) {
                Schema::table('order_items', function (Blueprint $table) {
                    $table->renameColumn('lego_model_id', 'moc_id');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop moc_images table
        Schema::dropIfExists('moc_images');

        // Rename mocs back to lego_models
        if (Schema::hasTable('mocs')) {
            Schema::table('mocs', function (Blueprint $table) {
                $table->dropIndex(['set_num']);
            });

            Schema::rename('mocs', 'lego_models');
        }

        // Recreate moc_sets table
        Schema::create('moc_sets', function (Blueprint $table) {
            $table->string('set_num', 20)->primary();
            $table->string('name', 256);
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('year');
            $table->unsignedInteger('theme_id');
            $table->unsignedInteger('num_parts')->default(0);
            $table->longText('ldr_content');
            $table->string('file_name')->nullable();
            $table->integer('total_steps')->default(0);
            $table->decimal('price', 10, 2)->nullable();
            $table->boolean('is_public')->default(true);
            $table->string('thumbnail')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->foreign('theme_id')->references('id')->on('themes')->onDelete('cascade');
            $table->index('theme_id');
            $table->index('year');
            $table->index('name');
            $table->index('user_id');
            $table->index('is_public');
        });

        // Re-add MOC fields to sets table
        Schema::table('sets', function (Blueprint $table) {
            $table->boolean('is_moc')->default(false)->after('num_parts');
            $table->longText('ldr_content')->nullable()->after('is_moc');
            $table->text('description')->nullable()->after('name');
            $table->string('file_name')->nullable()->after('ldr_content');
            $table->decimal('price', 10, 2)->nullable()->after('file_name');
            $table->boolean('is_public')->default(true)->after('price');
            $table->string('thumbnail')->nullable()->after('is_public');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade')->after('thumbnail');

            $table->index('is_moc');
            $table->index('user_id');
            $table->index('is_public');
        });
    }
};
