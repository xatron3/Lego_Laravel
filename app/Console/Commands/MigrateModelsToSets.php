<?php

namespace App\Console\Commands;

use App\Models\LegoModel;
use App\Models\MocSet;
use App\Models\Theme;
use Illuminate\Console\Command;

class MigrateModelsToSets extends Command
{
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected $signature = 'models:migrate-to-mocs {--force : Force migration without confirmation}';

  /**
   * The console command description.
   *
   * @var string
   */
  protected $description = 'Migrate existing lego_models to the moc_sets table';

  /**
   * Execute the console command.
   */
  public function handle()
  {
    if (!$this->option('force')) {
      if (!$this->confirm('This will migrate all lego_models to the moc_sets table. Continue?')) {
        $this->info('Migration cancelled.');
        return 0;
      }
    }

    // Get or create a "MOCs" theme
    $mocTheme = Theme::where('name', 'My Own Creations (MOCs)')->first();

    if (!$mocTheme) {
      // Get next available ID
      $maxId = Theme::max('id') ?? 0;
      $mocTheme = Theme::create([
        'id' => $maxId + 1,
        'name' => 'My Own Creations (MOCs)',
        'parent_id' => null,
      ]);
    }

    $this->info("Using theme: {$mocTheme->name} (ID: {$mocTheme->id})");

    $models = LegoModel::all();
    $this->info("Found {$models->count()} models to migrate.");

    $bar = $this->output->createProgressBar($models->count());
    $migrated = 0;
    $skipped = 0;

    foreach ($models as $model) {
      // Generate unique set_num for MOC
      $baseNum = 'MOC-' . str_pad($model->id, 6, '0', STR_PAD_LEFT);
      $setNum = $baseNum;
      $counter = 1;

      // Ensure uniqueness
      while (MocSet::where('set_num', $setNum)->exists()) {
        $setNum = $baseNum . '-' . $counter++;
      }

      try {
        MocSet::create([
          'set_num' => $setNum,
          'name' => $model->name,
          'description' => $model->description,
          'year' => date('Y'),
          'theme_id' => $mocTheme->id,
          'num_parts' => $model->total_parts,
          'ldr_content' => $model->ldr_content,
          'file_name' => $model->file_name,
          'total_steps' => $model->total_steps,
          'price' => $model->price,
          'is_public' => $model->is_public,
          'thumbnail' => $model->thumbnail,
          'user_id' => $model->user_id,
        ]);

        $migrated++;
      } catch (\Exception $e) {
        $this->error("Failed to migrate model {$model->id}: " . $e->getMessage());
        $skipped++;
      }

      $bar->advance();
    }

    $bar->finish();
    $this->newLine(2);
    $this->info("Migration complete!");
    $this->info("Migrated: {$migrated}");
    $this->info("Skipped: {$skipped}");

    return 0;
  }
}
