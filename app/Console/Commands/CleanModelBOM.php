<?php

namespace App\Console\Commands;

use App\Models\LegoModel;
use Illuminate\Console\Command;

class CleanModelBOM extends Command
{
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected $signature = 'lego:clean-bom';

  /**
   * The console command description.
   *
   * @var string
   */
  protected $description = 'Remove UTF-8 BOM from existing LDraw model content in the database';

  /**
   * Execute the console command.
   */
  public function handle()
  {
    $this->info('Scanning for models with BOM...');

    $models = LegoModel::all();
    $cleaned = 0;

    foreach ($models as $model) {
      $content = $model->ldr_content;

      // Check for UTF-8 BOM (U+FEFF)
      if (
        isset($content[0]) && ord($content[0]) === 0xEF &&
        isset($content[1]) && ord($content[1]) === 0xBB &&
        isset($content[2]) && ord($content[2]) === 0xBF
      ) {

        // Remove BOM (first 3 bytes)
        $model->ldr_content = substr($content, 3);
        $model->save();

        $this->line("✓ Cleaned BOM from: {$model->name}");
        $cleaned++;
      }
    }

    if ($cleaned === 0) {
      $this->info('No models with BOM found.');
    } else {
      $this->info("Successfully cleaned {$cleaned} model(s).");
    }

    return 0;
  }
}
