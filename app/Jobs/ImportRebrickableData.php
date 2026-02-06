<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ImportRebrickableData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 3600; // 1 hour timeout
    public int $tries = 1; // Don't retry on failure

    private string $jobId;
    private ?string $table;
    private array $tableConfig;

    /**
     * Create a new job instance.
     */
    public function __construct(?string $table = null, string $jobId = null)
    {
        $this->table = $table;
        $this->jobId = $jobId ?? uniqid('import_', true);

        $this->tableConfig = [
            'themes' => [
                'model' => \App\Models\Theme::class,
                'primaryKey' => 'id',
                'columns' => ['id', 'name', 'parent_id'],
            ],
            'colors' => [
                'model' => \App\Models\Color::class,
                'primaryKey' => 'id',
                'columns' => ['id', 'name', 'rgb', 'is_trans'],
            ],
            'part_categories' => [
                'model' => \App\Models\PartCategory::class,
                'primaryKey' => 'id',
                'columns' => ['id', 'name'],
            ],
            'parts' => [
                'model' => \App\Models\Part::class,
                'primaryKey' => 'part_num',
                'columns' => ['part_num', 'name', 'part_cat_id'],
            ],
            'minifigs' => [
                'model' => \App\Models\Minifig::class,
                'primaryKey' => 'fig_num',
                'columns' => ['fig_num', 'name', 'num_parts'],
            ],
            'sets' => [
                'model' => \App\Models\Set::class,
                'primaryKey' => 'set_num',
                'columns' => ['set_num', 'name', 'year', 'theme_id', 'num_parts'],
            ],
            'inventories' => [
                'model' => \App\Models\Inventory::class,
                'primaryKey' => 'id',
                'columns' => ['id', 'version', 'set_num'],
            ],
            'elements' => [
                'model' => \App\Models\Element::class,
                'primaryKey' => 'element_id',
                'columns' => ['element_id', 'part_num', 'color_id'],
            ],
            'part_relationships' => [
                'model' => \App\Models\PartRelationship::class,
                'primaryKey' => null,
                'columns' => ['rel_type', 'child_part_num', 'parent_part_num'],
            ],
            'inventory_parts' => [
                'model' => \App\Models\InventoryPart::class,
                'primaryKey' => null,
                'columns' => ['inventory_id', 'part_num', 'color_id', 'quantity', 'is_spare'],
            ],
            'inventory_minifigs' => [
                'model' => \App\Models\InventoryMinifig::class,
                'primaryKey' => null,
                'columns' => ['inventory_id', 'fig_num', 'quantity'],
            ],
            'inventory_sets' => [
                'model' => \App\Models\InventorySet::class,
                'primaryKey' => null,
                'columns' => ['inventory_id', 'set_num', 'quantity'],
            ],
        ];
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            if ($this->table) {
                // Import single table
                $this->updateProgress('processing', 0, "Starting import for {$this->table}...");
                $this->importTable($this->table);
                $this->updateProgress('completed', 100, 'Import completed successfully.');
            } else {
                // Import all tables in order
                $this->importAllTables();
            }
        } catch (\Exception $e) {
            Log::error("Import job failed: " . $e->getMessage(), [
                'table' => $this->table,
                'job_id' => $this->jobId,
                'trace' => $e->getTraceAsString()
            ]);
            $this->updateProgress('failed', 0, 'Import failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Import all tables in the correct order.
     */
    private function importAllTables(): void
    {
        $importOrder = [
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

        $totalTables = count($importOrder);
        $completed = 0;

        $this->updateProgress('processing', 0, 'Starting import of all tables...');

        foreach ($importOrder as $table) {
            $filePath = base_path("data/{$table}.csv");

            if (!file_exists($filePath)) {
                $this->updateProgress('processing', ($completed / $totalTables) * 100, "Skipping {$table} (file not found)...");
                $completed++;
                continue;
            }

            try {
                $this->updateProgress('processing', ($completed / $totalTables) * 100, "Importing {$table}...");
                $imported = $this->importTable($table);
                $this->updateProgress('processing', (($completed + 1) / $totalTables) * 100, "Completed {$table}: {$imported} records");
                $completed++;
            } catch (\Exception $e) {
                Log::error("Failed to import {$table}: " . $e->getMessage());
                $this->updateProgress('processing', ($completed / $totalTables) * 100, "Failed {$table}: " . $e->getMessage());
                $completed++;
            }
        }

        $this->updateProgress('completed', 100, 'All tables imported successfully.');
    }

    /**
     * Import a single table.
     */
    private function importTable(string $table): int
    {
        if (!isset($this->tableConfig[$table])) {
            throw new \Exception("Invalid table: {$table}");
        }

        $filePath = base_path("data/{$table}.csv");
        if (!file_exists($filePath)) {
            throw new \Exception("CSV file not found: {$table}.csv");
        }

        $config = $this->tableConfig[$table];
        return $this->importCsvFile($filePath, $table, $config);
    }

    /**
     * Import a CSV file into a table (skips existing records).
     */
    private function importCsvFile(string $filePath, string $table, array $config): int
    {
        // Count total lines first
        $totalLines = $this->countCsvLines($filePath);
        $this->updateProgress('processing', 0, "Found {$totalLines} records in {$table}.csv", $table, [
            'total' => $totalLines,
            'processed' => 0,
            'imported' => 0,
            'skipped' => 0,
        ]);

        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            throw new \Exception("Cannot open file: {$filePath}");
        }

        // Read header
        $header = fgetcsv($handle);
        if ($header === false) {
            fclose($handle);
            throw new \Exception("Cannot read CSV header");
        }

        // Map header to column indices
        $columnMap = [];
        foreach ($config['columns'] as $column) {
            $index = array_search($column, $header);
            if ($index === false) {
                $altName = $this->getAlternateColumnName($column);
                $index = array_search($altName, $header);
            }
            if ($index !== false) {
                $columnMap[$column] = $index;
            }
        }

        // Get existing primary keys to skip duplicates
        $existingKeys = [];
        if ($config['primaryKey']) {
            $existingKeys = DB::table($table)
                ->pluck($config['primaryKey'])
                ->flip()
                ->toArray();
        }

        $imported = 0;
        $skipped = 0;
        $batch = [];
        $batchSize = 500;
        $totalProcessed = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $data = [];
            foreach ($config['columns'] as $column) {
                if (isset($columnMap[$column])) {
                    $value = $row[$columnMap[$column]] ?? null;
                    $data[$column] = $this->transformValue($column, $value);
                }
            }

            // Skip rows with missing required data
            if ($config['primaryKey'] && empty($data[$config['primaryKey']])) {
                continue;
            }

            // Skip if record already exists (based on primary key)
            if ($config['primaryKey'] && isset($existingKeys[$data[$config['primaryKey']]])) {
                $skipped++;
                $totalProcessed++;
                continue;
            }

            $batch[] = $data;

            if (count($batch) >= $batchSize) {
                $inserted = $this->insertBatch($table, $batch);
                $imported += $inserted;
                $totalProcessed += count($batch);
                $batch = [];

                // Update progress with detailed stats
                $progress = $totalLines > 0 ? ($totalProcessed / $totalLines) * 100 : 0;
                $this->updateProgress('processing', $progress, "Processed {$totalProcessed} of {$totalLines} rows in {$table}", $table, [
                    'total' => $totalLines,
                    'processed' => $totalProcessed,
                    'imported' => $imported,
                    'skipped' => $skipped,
                ]);

                if (function_exists('gc_collect_cycles')) {
                    gc_collect_cycles();
                }
            }
        }

        // Insert remaining batch
        if (!empty($batch)) {
            $inserted = $this->insertBatch($table, $batch);
            $imported += $inserted;
            $totalProcessed += count($batch);
        }

        fclose($handle);

        // Final progress update
        $this->updateProgress('processing', 100, "Completed {$table}: {$imported} imported, {$skipped} skipped", $table, [
            'total' => $totalLines,
            'processed' => $totalProcessed,
            'imported' => $imported,
            'skipped' => $skipped,
        ]);

        Log::info("Import completed for {$table}: {$imported} inserted, {$skipped} skipped");

        return $imported;
    }

    /**
     * Insert a batch of records (skips duplicates).
     */
    private function insertBatch(string $table, array $batch): int
    {
        $now = now();

        // Add timestamps to all records
        foreach ($batch as &$record) {
            $record['created_at'] = $now;
            $record['updated_at'] = $now;
        }

        try {
            // Use insertOrIgnore to skip duplicates
            DB::table($table)->insertOrIgnore($batch);
            return count($batch);
        } catch (\Exception $e) {
            // Fallback to individual inserts
            $inserted = 0;
            foreach ($batch as $record) {
                try {
                    DB::table($table)->insertOrIgnore($record);
                    $inserted++;
                } catch (\Exception $e2) {
                    // Skip individual failures
                }
            }
            return $inserted;
        }
    }

    /**
     * Count lines in CSV file (excluding header).
     */
    private function countCsvLines(string $filePath): int
    {
        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            return 0;
        }

        $count = 0;
        fgetcsv($handle); // Skip header
        while (fgets($handle) !== false) {
            $count++;
        }
        fclose($handle);

        return $count;
    }

    /**
     * Get alternate column name for CSV variations.
     */
    private function getAlternateColumnName(string $column): string
    {
        return match ($column) {
            'is_trans' => 'is_transparent',
            default => $column,
        };
    }

    /**
     * Transform value based on column type.
     */
    private function transformValue(string $column, ?string $value): mixed
    {
        if ($value === '' || $value === null) {
            return match ($column) {
                'parent_id', 'part_cat_id', 'theme_id', 'color_id', 'inventory_id' => null,
                'is_trans', 'is_spare' => false,
                'quantity', 'num_parts', 'version' => 0,
                default => null,
            };
        }

        return match ($column) {
            'is_trans', 'is_spare' => strtolower($value) === 'true' || $value === '1' || strtolower($value) === 't',
            'id', 'parent_id', 'part_cat_id', 'theme_id', 'color_id', 'inventory_id', 'year', 'quantity', 'num_parts', 'version' => (int) $value,
            default => $value,
        };
    }

    /**
     * Update import progress in cache.
     */
    private function updateProgress(string $status, ?float $progress, string $message, ?string $table = null, ?array $stats = null): void
    {
        $data = [
            'status' => $status, // 'pending', 'processing', 'completed', 'failed'
            'progress' => $progress,
            'message' => $message,
            'table' => $table ?? $this->table,
            'updated_at' => now()->toISOString(),
        ];

        if ($stats) {
            $data['stats'] = $stats;
        }

        Cache::put("import_progress:{$this->jobId}", $data, now()->addHours(24));
    }

    /**
     * Get the job ID for tracking.
     */
    public function getJobId(): string
    {
        return $this->jobId;
    }
}
