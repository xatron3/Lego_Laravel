<?php

namespace App\Console\Commands;

use App\Models\MocSet;
use App\Models\Inventory;
use App\Models\InventoryPart;
use App\Models\Part;
use Illuminate\Console\Command;

class GenerateMocInventories extends Command
{
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected $signature = 'moc:generate-inventories {set_num?} {--force : Force regeneration even if inventory exists}';

  /**
   * The console command description.
   *
   * @var string
   */
  protected $description = 'Generate inventory_parts from LDR file content for MOCs';

  /**
   * Execute the console command.
   */
  public function handle()
  {
    if ($setNum = $this->argument('set_num')) {
      // Generate for specific MOC
      $moc = MocSet::where('set_num', $setNum)->first();
      if (!$moc) {
        $this->error("MOC not found: {$setNum}");
        return 1;
      }
      $this->generateInventoryForMoc($moc);
    } else {
      // Generate for all MOCs
      $mocs = MocSet::all();
      $this->info("Found {$mocs->count()} MOCs to process.");

      $bar = $this->output->createProgressBar($mocs->count());

      foreach ($mocs as $moc) {
        $this->generateInventoryForMoc($moc);
        $bar->advance();
      }

      $bar->finish();
      $this->newLine(2);
      $this->info("Inventory generation complete!");
    }

    return 0;
  }

  /**
   * Generate inventory for a specific MOC.
   */
  protected function generateInventoryForMoc(MocSet $moc): void
  {
    // Check if inventory already exists
    $existingInventory = Inventory::where('set_num', $moc->set_num)->first();

    if ($existingInventory && !$this->option('force')) {
      return; // Skip if inventory exists and not forcing
    }

    // Delete existing inventory if forcing
    if ($existingInventory) {
      InventoryPart::where('inventory_id', $existingInventory->id)->delete();
      $existingInventory->delete();
    }

    if (empty($moc->ldr_content)) {
      return; // No LDR content to parse
    }

    // Parse LDR file
    $parts = $this->parseLdrFile($moc->ldr_content);

    if (empty($parts)) {
      return; // No parts found
    }

    // Create inventory
    $nextId = Inventory::max('id') + 1;
    $inventory = Inventory::create([
      'id' => $nextId,
      'set_num' => $moc->set_num,
      'version' => 1,
    ]);

    // Create inventory_parts
    foreach ($parts as $partData) {
      // Try to find the part in the database
      $part = Part::where('part_num', $partData['part_num'])->first();

      if (!$part) {
        // Part doesn't exist in Rebrickable data - skip it
        continue;
      }

      // Map LDraw color 0 (default) to a valid color
      $colorId = $partData['color_id'];
      if ($colorId == 0) {
        // Use color 1 (White) as default for LDraw color 0
        $colorId = 1;
      }

      // Verify color exists
      if (!\App\Models\Color::where('id', $colorId)->exists()) {
        // Color doesn't exist - use default color 1 (White)
        $colorId = 1;
      }

      InventoryPart::create([
        'inventory_id' => $inventory->id,
        'part_num' => $partData['part_num'],
        'color_id' => $colorId,
        'quantity' => $partData['quantity'],
        'is_spare' => false,
      ]);
    }

    // Update num_parts on the MOC
    $totalParts = array_sum(array_column($parts, 'quantity'));
    $moc->update(['num_parts' => $totalParts]);
  }

  /**
   * Parse LDR file content and extract part information.
   *
   * @param string $ldrContent
   * @return array Array of ['part_num' => string, 'color_id' => int, 'quantity' => int]
   */
  protected function parseLdrFile(string $ldrContent): array
  {
    $lines = preg_split('/\r?\n/', $ldrContent);
    $partCounts = [];

    foreach ($lines as $line) {
      $line = trim($line);

      // LDR part lines start with "1" followed by color code and part reference
      // Format: 1 <color> <x> <y> <z> <a> <b> <c> <d> <e> <f> <g> <h> <i> <part.dat>
      if (preg_match('/^1\s+(\d+)\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+(.+\.dat)/i', $line, $matches)) {
        $colorId = (int) $matches[1];
        $partFile = $matches[2];

        // Extract part number from filename (remove .dat extension and path)
        $partNum = preg_replace('/\.dat$/i', '', basename($partFile));

        // Create unique key for part+color combination
        $key = $partNum . '_' . $colorId;

        if (!isset($partCounts[$key])) {
          $partCounts[$key] = [
            'part_num' => $partNum,
            'color_id' => $colorId,
            'quantity' => 0,
          ];
        }

        $partCounts[$key]['quantity']++;
      }
    }

    return array_values($partCounts);
  }
}
