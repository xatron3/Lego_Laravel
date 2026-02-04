<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Color;
use App\Models\Element;
use App\Models\Inventory;
use App\Models\InventoryMinifig;
use App\Models\InventoryPart;
use App\Models\InventorySet;
use App\Models\Minifig;
use App\Models\Part;
use App\Models\PartCategory;
use App\Models\PartRelationship;
use App\Models\Set;
use App\Models\Theme;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RebrickableController extends Controller
{
  /**
   * Table configuration for import order and model mapping.
   */
  private array $tableConfig = [
    'themes' => [
      'model' => Theme::class,
      'primaryKey' => 'id',
      'columns' => ['id', 'name', 'parent_id'],
    ],
    'colors' => [
      'model' => Color::class,
      'primaryKey' => 'id',
      'columns' => ['id', 'name', 'rgb', 'is_trans'],
    ],
    'part_categories' => [
      'model' => PartCategory::class,
      'primaryKey' => 'id',
      'columns' => ['id', 'name'],
    ],
    'parts' => [
      'model' => Part::class,
      'primaryKey' => 'part_num',
      'columns' => ['part_num', 'name', 'part_cat_id'],
    ],
    'minifigs' => [
      'model' => Minifig::class,
      'primaryKey' => 'fig_num',
      'columns' => ['fig_num', 'name', 'num_parts'],
    ],
    'sets' => [
      'model' => Set::class,
      'primaryKey' => 'set_num',
      'columns' => ['set_num', 'name', 'year', 'theme_id', 'num_parts'],
    ],
    'inventories' => [
      'model' => Inventory::class,
      'primaryKey' => 'id',
      'columns' => ['id', 'version', 'set_num'],
    ],
    'elements' => [
      'model' => Element::class,
      'primaryKey' => 'element_id',
      'columns' => ['element_id', 'part_num', 'color_id'],
    ],
    'part_relationships' => [
      'model' => PartRelationship::class,
      'primaryKey' => null, // auto-increment
      'columns' => ['rel_type', 'child_part_num', 'parent_part_num'],
    ],
    'inventory_parts' => [
      'model' => InventoryPart::class,
      'primaryKey' => null, // auto-increment
      'columns' => ['inventory_id', 'part_num', 'color_id', 'quantity', 'is_spare'],
    ],
    'inventory_minifigs' => [
      'model' => InventoryMinifig::class,
      'primaryKey' => null, // auto-increment
      'columns' => ['inventory_id', 'fig_num', 'quantity'],
    ],
    'inventory_sets' => [
      'model' => InventorySet::class,
      'primaryKey' => null, // auto-increment
      'columns' => ['inventory_id', 'set_num', 'quantity'],
    ],
  ];

  /**
   * Get statistics for all Rebrickable tables.
   */
  public function stats(): JsonResponse
  {
    return response()->json([
      'themes' => Theme::count(),
      'colors' => Color::count(),
      'part_categories' => PartCategory::count(),
      'parts' => Part::count(),
      'minifigs' => Minifig::count(),
      'sets' => Set::count(),
      'inventories' => Inventory::count(),
      'elements' => Element::count(),
      'part_relationships' => PartRelationship::count(),
      'inventory_parts' => InventoryPart::count(),
      'inventory_minifigs' => InventoryMinifig::count(),
      'inventory_sets' => InventorySet::count(),
    ]);
  }

  /**
   * Import CSV data for a specific table.
   */
  public function import(Request $request, string $table): JsonResponse
  {
    if (!isset($this->tableConfig[$table])) {
      return response()->json(['message' => 'Invalid table name.'], 400);
    }

    $request->validate([
      'file' => 'required|file|mimes:csv,txt|max:102400', // 100MB max
    ]);

    $config = $this->tableConfig[$table];
    $file = $request->file('file');

    try {
      $imported = $this->importCsvFile($file->getPathname(), $table, $config);

      return response()->json([
        'message' => "Successfully imported {$imported} records into {$table}.",
        'imported' => $imported,
        'table' => $table,
      ]);
    } catch (\Exception $e) {
      Log::error("Failed to import {$table}: " . $e->getMessage());
      return response()->json([
        'message' => 'Import failed: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Import CSV file from server data directory.
   */
  public function importFromServer(Request $request, string $table): JsonResponse
  {
    if (!isset($this->tableConfig[$table])) {
      return response()->json(['message' => 'Invalid table name.'], 400);
    }

    // Increase execution time for large imports
    set_time_limit(600); // 10 minutes
    ini_set('memory_limit', '512M');

    $config = $this->tableConfig[$table];
    $filePath = base_path("data/{$table}.csv");

    if (!file_exists($filePath)) {
      return response()->json(['message' => "CSV file not found: {$table}.csv"], 404);
    }

    try {
      $imported = $this->importCsvFile($filePath, $table, $config);

      return response()->json([
        'message' => "Successfully processed {$imported} records in {$table}.",
        'imported' => $imported,
        'table' => $table,
      ]);
    } catch (\Exception $e) {
      Log::error("Failed to import {$table}: " . $e->getMessage());
      return response()->json([
        'message' => 'Import failed: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Import all tables from server data directory in correct order.
   */
  public function importAllFromServer(): JsonResponse
  {
    // Increase execution time for large imports (30 minutes)
    set_time_limit(1800);
    ini_set('memory_limit', '1G');

    $results = [];
    $errors = [];

    // Import order matters due to foreign keys
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

    foreach ($importOrder as $table) {
      $filePath = base_path("data/{$table}.csv");

      if (!file_exists($filePath)) {
        $errors[$table] = "File not found: {$table}.csv";
        continue;
      }

      try {
        $config = $this->tableConfig[$table];
        $imported = $this->importCsvFile($filePath, $table, $config);
        $results[$table] = $imported;
      } catch (\Exception $e) {
        Log::error("Failed to import {$table}: " . $e->getMessage());
        $errors[$table] = $e->getMessage();
        // Continue with other tables even if one fails
      }
    }

    return response()->json([
      'message' => 'Import completed.',
      'results' => $results,
      'errors' => $errors,
    ]);
  }

  /**
   * Clear all data from a specific table.
   */
  public function clear(string $table): JsonResponse
  {
    if (!isset($this->tableConfig[$table])) {
      return response()->json(['message' => 'Invalid table name.'], 400);
    }

    try {
      DB::statement('SET FOREIGN_KEY_CHECKS=0;');
      DB::table($table)->truncate();
      DB::statement('SET FOREIGN_KEY_CHECKS=1;');

      return response()->json([
        'message' => "Successfully cleared {$table}.",
      ]);
    } catch (\Exception $e) {
      // For SQLite
      try {
        DB::table($table)->delete();
        return response()->json([
          'message' => "Successfully cleared {$table}.",
        ]);
      } catch (\Exception $e2) {
        return response()->json([
          'message' => 'Failed to clear table: ' . $e2->getMessage(),
        ], 500);
      }
    }
  }

  /**
   * Clear all Rebrickable tables.
   */
  public function clearAll(): JsonResponse
  {
    // Clear in reverse order due to foreign keys
    $clearOrder = [
      'inventory_sets',
      'inventory_minifigs',
      'inventory_parts',
      'part_relationships',
      'elements',
      'inventories',
      'sets',
      'minifigs',
      'parts',
      'part_categories',
      'colors',
      'themes',
    ];

    try {
      DB::statement('PRAGMA foreign_keys = OFF;');
    } catch (\Exception $e) {
      // Not SQLite, try MySQL
      try {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
      } catch (\Exception $e2) {
        // Ignore
      }
    }

    foreach ($clearOrder as $table) {
      try {
        DB::table($table)->truncate();
      } catch (\Exception $e) {
        try {
          DB::table($table)->delete();
        } catch (\Exception $e2) {
          // Ignore individual table errors
        }
      }
    }

    try {
      DB::statement('PRAGMA foreign_keys = ON;');
    } catch (\Exception $e) {
      try {
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
      } catch (\Exception $e2) {
        // Ignore
      }
    }

    return response()->json([
      'message' => 'All Rebrickable tables cleared.',
    ]);
  }

  /**
   * Import a CSV file into a table.
   */
  private function importCsvFile(string $filePath, string $table, array $config): int
  {
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
        // Handle column name variations
        $altName = $this->getAlternateColumnName($column);
        $index = array_search($altName, $header);
      }
      if ($index !== false) {
        $columnMap[$column] = $index;
      }
    }

    $imported = 0;
    $updated = 0;
    $batch = [];
    $batchSize = 500; // Reduced for better memory management

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

      $batch[] = $data;

      if (count($batch) >= $batchSize) {
        $result = $this->upsertBatch($table, $batch, $config);
        $imported += $result['inserted'];
        $updated += $result['updated'];
        $batch = [];

        // Free memory on large imports
        if (function_exists('gc_collect_cycles')) {
          gc_collect_cycles();
        }
      }
    }

    // Insert remaining batch
    if (!empty($batch)) {
      $result = $this->upsertBatch($table, $batch, $config);
      $imported += $result['inserted'];
      $updated += $result['updated'];
    }

    fclose($handle);

    return $imported + $updated;
  }

  /**
   * Get alternate column name for variations in CSV files.
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
   * Upsert a batch of records (insert or update if exists).
   */
  private function upsertBatch(string $table, array $batch, array $config): array
  {
    $now = now();
    $inserted = 0;
    $updated = 0;

    // Add timestamps to all records
    foreach ($batch as &$record) {
      $record['created_at'] = $now;
      $record['updated_at'] = $now;
    }

    if ($config['primaryKey']) {
      // For tables with primary keys, use upsert (Laravel 8+)
      try {
        // Use upsert which inserts or updates
        $uniqueBy = [$config['primaryKey']];
        $updateColumns = array_diff($config['columns'], [$config['primaryKey']]);
        $updateColumns[] = 'updated_at'; // Always update timestamp

        DB::table($table)->upsert($batch, $uniqueBy, $updateColumns);

        // Since upsert doesn't tell us how many were inserted vs updated,
        // we'll count them all as "imported"
        $inserted = count($batch);
      } catch (\Exception $e) {
        // Fallback to individual inserts with ignore
        foreach ($batch as $record) {
          try {
            DB::table($table)->insertOrIgnore($record);
            $inserted++;
          } catch (\Exception $e2) {
            // Skip duplicates
          }
        }
      }
    } else {
      // For junction tables without explicit primary key, use insertOrIgnore
      try {
        DB::table($table)->insertOrIgnore($batch);
        $inserted = count($batch);
      } catch (\Exception $e) {
        // Fallback to individual inserts
        foreach ($batch as $record) {
          try {
            DB::table($table)->insertOrIgnore($record);
            $inserted++;
          } catch (\Exception $e2) {
            // Skip duplicates
          }
        }
      }
    }

    return ['inserted' => $inserted, 'updated' => $updated];
  }

    // ==================== CRUD Operations ====================

  /**
   * List records from a table with pagination.
   */
  public function index(Request $request, string $table): JsonResponse
  {
    if (!isset($this->tableConfig[$table])) {
      return response()->json(['message' => 'Invalid table name.'], 400);
    }

    $config = $this->tableConfig[$table];
    $query = $config['model']::query();

    // Search
    if ($search = $request->get('search')) {
      $query->where(function ($q) use ($search, $config) {
        foreach ($config['columns'] as $column) {
          if (str_contains($column, 'name') || str_contains($column, 'num')) {
            $q->orWhere($column, 'like', "%{$search}%");
          }
        }
      });
    }

    // Sorting
    $sortBy = $request->get('sort', $config['primaryKey'] ?? 'id');
    $sortDir = $request->get('direction', 'asc');
    $query->orderBy($sortBy, $sortDir);

    $perPage = min($request->get('per_page', 50), 100);

    return response()->json($query->paginate($perPage));
  }

  /**
   * Get a single record.
   */
  public function show(string $table, string $id): JsonResponse
  {
    if (!isset($this->tableConfig[$table])) {
      return response()->json(['message' => 'Invalid table name.'], 400);
    }

    $config = $this->tableConfig[$table];
    $model = $config['model']::find($id);

    if (!$model) {
      return response()->json(['message' => 'Record not found.'], 404);
    }

    return response()->json($model);
  }

  /**
   * Update a record.
   */
  public function update(Request $request, string $table, string $id): JsonResponse
  {
    if (!isset($this->tableConfig[$table])) {
      return response()->json(['message' => 'Invalid table name.'], 400);
    }

    $config = $this->tableConfig[$table];
    $model = $config['model']::find($id);

    if (!$model) {
      return response()->json(['message' => 'Record not found.'], 404);
    }

    $data = $request->only($config['columns']);
    $model->update($data);

    return response()->json([
      'message' => 'Record updated successfully.',
      'data' => $model->fresh(),
    ]);
  }

  /**
   * Delete a record.
   */
  public function destroy(string $table, string $id): JsonResponse
  {
    if (!isset($this->tableConfig[$table])) {
      return response()->json(['message' => 'Invalid table name.'], 400);
    }

    $config = $this->tableConfig[$table];
    $model = $config['model']::find($id);

    if (!$model) {
      return response()->json(['message' => 'Record not found.'], 404);
    }

    try {
      $model->delete();
      return response()->json(['message' => 'Record deleted successfully.']);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Cannot delete record: ' . $e->getMessage(),
      ], 422);
    }
  }

  /**
   * Create a new record.
   */
  public function store(Request $request, string $table): JsonResponse
  {
    if (!isset($this->tableConfig[$table])) {
      return response()->json(['message' => 'Invalid table name.'], 400);
    }

    $config = $this->tableConfig[$table];
    $data = $request->only($config['columns']);

    try {
      $model = $config['model']::create($data);
      return response()->json([
        'message' => 'Record created successfully.',
        'data' => $model,
      ], 201);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Failed to create record: ' . $e->getMessage(),
      ], 422);
    }
  }

  /**
   * Get available tables for import.
   */
  public function tables(): JsonResponse
  {
    $tables = [];
    foreach ($this->tableConfig as $name => $config) {
      $filePath = base_path("data/{$name}.csv");
      $tables[$name] = [
        'has_file' => file_exists($filePath),
        'columns' => $config['columns'],
        'primary_key' => $config['primaryKey'],
      ];
    }
    return response()->json($tables);
  }
}
