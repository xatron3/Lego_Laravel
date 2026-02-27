<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Color;
use App\Jobs\ImportRebrickableData;
use Illuminate\Support\Facades\DB;

class FixMissingColorZero extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rebrickable:fix-color-zero
                            {--reimport-all : Reimport all data tables to fix missing relationships}
                            {--reimport-colors : Only reimport colors table}
                            {--reimport-elements : Only reimport elements table}
                            {--reimport-inventory-parts : Only reimport inventory_parts table}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix missing color ID 0 (Black) and optionally reimport affected data';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Checking for color ID 0 (Black)...');

        $colorExists = Color::where('id', 0)->exists();

        if ($colorExists) {
            $this->info('✓ Color ID 0 (Black) already exists in database.');
        } else {
            $this->warn('✗ Color ID 0 (Black) is missing!');
            $this->info('This is caused by a bug in the import logic that treated ID 0 as empty.');
            $this->newLine();

            // Check if colors.csv exists
            $colorsFile = base_path('data/colors.csv');
            if (!file_exists($colorsFile)) {
                $this->error('Cannot fix: data/colors.csv file not found!');
                return 1;
            }

            // Import color 0 directly
            $this->info('Importing color ID 0 from colors.csv...');
            $this->importColorZero($colorsFile);

            $colorExists = Color::where('id', 0)->exists();
            if ($colorExists) {
                $this->info('✓ Successfully imported color ID 0 (Black)!');
            } else {
                $this->error('✗ Failed to import color ID 0.');
                return 1;
            }
        }

        $this->newLine();

        // Handle reimport options
        if ($this->option('reimport-all')) {
            $this->info('Reimporting all data tables to fix relationships...');
            $this->reimportAllTables();
        } elseif ($this->option('reimport-colors')) {
            $this->info('Reimporting colors table...');
            $this->reimportTable('colors');
        } elseif ($this->option('reimport-elements')) {
            $this->info('Reimporting elements table...');
            $this->reimportTable('elements');
        } elseif ($this->option('reimport-inventory-parts')) {
            $this->info('Reimporting inventory_parts table...');
            $this->reimportTable('inventory_parts');
        } else {
            $this->newLine();
            $this->info('Color ID 0 is now fixed. To reimport affected data, run:');
            $this->comment('  php artisan rebrickable:fix-color-zero --reimport-all');
            $this->comment('  php artisan rebrickable:fix-color-zero --reimport-colors');
            $this->comment('  php artisan rebrickable:fix-color-zero --reimport-elements');
            $this->comment('  php artisan rebrickable:fix-color-zero --reimport-inventory-parts');
        }

        return 0;
    }

    /**
     * Import color ID 0 directly from CSV.
     */
    private function importColorZero(string $filePath): void
    {
        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            $this->error("Cannot open file: {$filePath}");
            return;
        }

        // Read header
        $header = fgetcsv($handle, 0, ',', '"', '');
        if ($header === false) {
            fclose($handle);
            $this->error("Cannot read CSV header");
            return;
        }

        // Find column indices
        $idIndex = array_search('id', $header);
        $nameIndex = array_search('name', $header);
        $rgbIndex = array_search('rgb', $header);
        $isTransIndex = array_search('is_trans', $header);

        if ($isTransIndex === false) {
            $isTransIndex = array_search('is_transparent', $header);
        }

        // Read rows until we find color ID 0
        while (($row = fgetcsv($handle, 0, ',', '"', '')) !== false) {
            if (isset($row[$idIndex]) && $row[$idIndex] === '0') {
                // Found color 0
                $colorData = [
                    'id' => 0,
                    'name' => $row[$nameIndex] ?? 'Black',
                    'rgb' => $row[$rgbIndex] ?? '05131D',
                    'is_trans' => isset($row[$isTransIndex])
                        ? (strtolower($row[$isTransIndex]) === 'true' || $row[$isTransIndex] === '1' || strtolower($row[$isTransIndex]) === 't')
                        : false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                try {
                    Color::create($colorData);
                    $this->info("Imported: Color {$colorData['id']} - {$colorData['name']} (#{$colorData['rgb']})");
                } catch (\Exception $e) {
                    $this->error("Failed to import color 0: " . $e->getMessage());
                }

                fclose($handle);
                return;
            }
        }

        fclose($handle);
        $this->warn('Color ID 0 not found in CSV file.');
    }

    /**
     * Reimport a single table using the job.
     */
    private function reimportTable(string $table): void
    {
        $jobId = uniqid('fix_', true);

        $this->info("Starting reimport job for {$table}...");
        $this->info("Job ID: {$jobId}");

        // Dispatch synchronously so we can show progress
        $job = new ImportRebrickableData($table, $jobId, true);
        $job->handle();

        $this->info("✓ Reimport completed for {$table}");
    }

    /**
     * Reimport all tables.
     */
    private function reimportAllTables(): void
    {
        $tables = [
            'colors',
            'elements',
            'inventory_parts',
        ];

        foreach ($tables as $table) {
            $this->reimportTable($table);
            $this->newLine();
        }

        $this->info('✓ All tables reimported successfully!');
    }
}
