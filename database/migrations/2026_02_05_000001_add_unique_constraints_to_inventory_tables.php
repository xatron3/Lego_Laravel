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
    // Clear tables that will get unique constraints
    echo "\nClearing tables to remove duplicates...\n";

    // Disable foreign key checks (database-agnostic)
    $this->disableForeignKeyChecks();

    DB::table('inventory_parts')->truncate();
    DB::table('inventory_minifigs')->truncate();
    DB::table('inventory_sets')->truncate();
    DB::table('part_relationships')->truncate();

    // Re-enable foreign key checks
    $this->enableForeignKeyChecks();

    echo "Tables cleared. Adding unique constraints...\n";

    // Add unique constraint for inventory_parts
    Schema::table('inventory_parts', function (Blueprint $table) {
      $table->unique(['inventory_id', 'part_num', 'color_id', 'is_spare'], 'inventory_parts_unique');
    });

    // Add unique constraint for inventory_minifigs
    Schema::table('inventory_minifigs', function (Blueprint $table) {
      $table->unique(['inventory_id', 'fig_num'], 'inventory_minifigs_unique');
    });

    // Add unique constraint for inventory_sets
    Schema::table('inventory_sets', function (Blueprint $table) {
      $table->unique(['inventory_id', 'set_num'], 'inventory_sets_unique');
    });

    // Add unique constraint for part_relationships
    Schema::table('part_relationships', function (Blueprint $table) {
      $table->unique(['rel_type', 'child_part_num', 'parent_part_num'], 'part_relationships_unique');
    });

    echo "Unique constraints added successfully! ✅\n";
    echo "\nPlease re-import the following tables:\n";
    echo "  - inventory_parts\n";
    echo "  - inventory_minifigs\n";
    echo "  - inventory_sets\n";
    echo "  - part_relationships\n\n";
  }

  /*
     |--------------------------------------------------------------------------
     | FAST CHUNKED DELETE WITH PROGRESS
     |--------------------------------------------------------------------------
     */

  private function truncateSlowly(string $table): void
  {
    echo "\n[{$table}] Starting deletion...\n";

    $total = DB::table($table)->count();
    echo "[{$table}] {$total} rows found\n";

    $deletedTotal = 0;

    while (true) {
      $deleted = DB::affectingStatement("
                DELETE FROM {$table}
                ORDER BY id
                LIMIT {$this->chunkSize}
            ");

      if ($deleted === 0) {
        break;
      }

      $deletedTotal += $deleted;

      $percent = $total > 0
        ? round(($deletedTotal / $total) * 100, 2)
        : 100;

      echo "[{$table}] Deleted {$deletedTotal}/{$total} ({$percent}%)\n";
    }

    echo "[{$table}] Done ✅\n";
  }

  /*
     |--------------------------------------------------------------------------
     | ADD UNIQUE CONSTRAINTS
     |--------------------------------------------------------------------------
     */

  private function addConstraints(): void
  {
    echo "\nAdding unique constraints...\n";

    Schema::table('inventory_parts', function (Blueprint $table) {
      $table->unique(
        ['inventory_id', 'part_num', 'color_id', 'is_spare'],
        'inventory_parts_unique'
      );
    });

    Schema::table('inventory_minifigs', function (Blueprint $table) {
      $table->unique(
        ['inventory_id', 'fig_num'],
        'inventory_minifigs_unique'
      );
    });

    Schema::table('inventory_sets', function (Blueprint $table) {
      $table->unique(
        ['inventory_id', 'set_num'],
        'inventory_sets_unique'
      );
    });

    Schema::table('part_relationships', function (Blueprint $table) {
      $table->unique(
        ['rel_type', 'child_part_num', 'parent_part_num'],
        'part_relationships_unique'
      );
    });

    echo "All constraints added 🎉\n";
  }

    /*
     |--------------------------------------------------------------------------
     | DATABASE-AGNOSTIC FOREIGN KEY HELPERS
     |--------------------------------------------------------------------------
     */

  /**
   * Disable foreign key checks for the current database driver.
   */
  private function disableForeignKeyChecks(): void
  {
    $driver = DB::getDriverName();

    switch ($driver) {
      case 'mysql':
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        break;
      case 'sqlite':
        DB::statement('PRAGMA foreign_keys = OFF');
        break;
      case 'pgsql':
        // PostgreSQL doesn't have a global foreign key disable
        // Each table needs to be handled individually if needed
        break;
    }
  }

  /**
   * Re-enable foreign key checks for the current database driver.
   */
  private function enableForeignKeyChecks(): void
  {
    $driver = DB::getDriverName();

    switch ($driver) {
      case 'mysql':
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
        break;
      case 'sqlite':
        DB::statement('PRAGMA foreign_keys = ON');
        break;
      case 'pgsql':
        // PostgreSQL doesn't have a global foreign key disable
        break;
    }
  }

  /*
     |--------------------------------------------------------------------------
     | ROLLBACK
     |--------------------------------------------------------------------------
     */

  public function down(): void
  {
    Schema::table('inventory_parts', function (Blueprint $table) {
      $table->dropUnique('inventory_parts_unique');
    });

    Schema::table('inventory_minifigs', function (Blueprint $table) {
      $table->dropUnique('inventory_minifigs_unique');
    });

    Schema::table('inventory_sets', function (Blueprint $table) {
      $table->dropUnique('inventory_sets_unique');
    });

    Schema::table('part_relationships', function (Blueprint $table) {
      $table->dropUnique('part_relationships_unique');
    });
  }
};
