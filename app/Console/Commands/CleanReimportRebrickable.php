<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\ImportRebrickableData;
use Illuminate\Support\Facades\DB;

class CleanReimportRebrickable extends Command
{
  protected $signature = 'rebrickable:clean-reimport
                            {--tables=* : Specific tables to reimport (optional, default: all)}
                            {--skip-clear : Skip clearing tables (only reimport)}';

  protected $description = 'Clean reimport of Rebrickable data - clears and reimports all data from CSV files';

  private array $importOrder = [
    'themes',
    'colors',
    'part_categories',
    'parts',
    'minifigs',
    'sets',
    'inventories',
    'elements',
    'part_relationships',
    'inventory_parts',
    'inventory_minifigs',
    'inventory_sets',
  ];

  public function handle(): int
  {
    $this->info('╔══════════════════════════════════════════════════════════╗');
    $this->info('║     CLEAN REIMPORT OF REBRICKABLE DATA                  ║');
    $this->info('╚══════════════════════════════════════════════════════════╝');
    $this->newLine();

    // Determine which tables to process
    $tablesToProcess = $this->option('tables');
    if (empty($tablesToProcess)) {
      $tablesToProcess = $this->importOrder;
    }

    // Confirm with user
    if (!$this->option('skip-clear')) {
      $this->warn('⚠️  This will DELETE all data from the following tables:');
      foreach ($tablesToProcess as $table) {
        $count = DB::table($table)->count();
        $this->line("   - {$table} ({$count} records)");
      }
      $this->newLine();

      if (!$this->confirm('Are you sure you want to continue?')) {
        $this->info('Operation cancelled.');
        return 0;
      }
      $this->newLine();

      // Clear tables
      $this->clearTables($tablesToProcess);
    }

    // Reimport tables
    $this->info('📥 Starting reimport...');
    $this->newLine();

    foreach ($tablesToProcess as $table) {
      if (!in_array($table, $this->importOrder)) {
        $this->warn("⏩ Skipping unknown table: {$table}");
        continue;
      }

      $filePath = base_path("data/{$table}.csv");
      if (!file_exists($filePath)) {
        $this->warn("⏩ Skipping {$table} - CSV file not found");
        continue;
      }

      $this->info("📦 Importing {$table}...");

      try {
        $jobId = uniqid('clean_reimport_', true);
        $job = new ImportRebrickableData($table, $jobId, false); // forceUpdate = false for clean import
        $job->handle();

        $count = DB::table($table)->count();
        $this->info("   ✅ {$table}: {$count} records imported");
      } catch (\Exception $e) {
        $this->error("   ❌ Failed to import {$table}: " . $e->getMessage());
        $this->newLine();

        if (!$this->confirm("Continue with remaining tables?")) {
          return 1;
        }
      }

      $this->newLine();
    }

    // Final summary
    $this->info('╔══════════════════════════════════════════════════════════╗');
    $this->info('║     REIMPORT COMPLETE                                   ║');
    $this->info('╚══════════════════════════════════════════════════════════╝');
    $this->newLine();

    $this->info('📊 Final Statistics:');
    foreach ($tablesToProcess as $table) {
      if (in_array($table, $this->importOrder)) {
        $count = DB::table($table)->count();
        $this->line("   - {$table}: {$count} records");
      }
    }

    $this->newLine();
    $this->info('🎉 All done! Data has been cleanly reimported.');

    // Verify color 0
    $colorZeroExists = DB::table('colors')->where('id', 0)->exists();
    if ($colorZeroExists) {
      $this->info('✅ Color ID 0 (Black) is present');
    } else {
      $this->warn('⚠️  Color ID 0 (Black) is MISSING!');
    }

    return 0;
  }

  private function clearTables(array $tables): void
  {
    $this->info('🗑️  Clearing tables...');
    $this->newLine();

    // Reverse order for foreign key constraints
    $clearOrder = array_reverse($tables);

    // Disable foreign key checks
    try {
      DB::statement('SET FOREIGN_KEY_CHECKS=0');
    } catch (\Exception $e) {
      try {
        DB::statement('PRAGMA foreign_keys = OFF');
      } catch (\Exception $e2) {
        // Continue anyway
      }
    }

    foreach ($clearOrder as $table) {
      if (!in_array($table, $this->importOrder)) {
        continue;
      }

      try {
        $count = DB::table($table)->count();
        DB::table($table)->truncate();
        $this->line("   ✅ Cleared {$table} ({$count} records deleted)");
      } catch (\Exception $e) {
        try {
          $count = DB::table($table)->count();
          DB::table($table)->delete();
          $this->line("   ✅ Cleared {$table} ({$count} records deleted)");
        } catch (\Exception $e2) {
          $this->warn("   ⚠️  Failed to clear {$table}: " . $e2->getMessage());
        }
      }
    }

    // Re-enable foreign key checks
    try {
      DB::statement('SET FOREIGN_KEY_CHECKS=1');
    } catch (\Exception $e) {
      try {
        DB::statement('PRAGMA foreign_keys = ON');
      } catch (\Exception $e2) {
        // Continue anyway
      }
    }

    $this->newLine();
  }
}
