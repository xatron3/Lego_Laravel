<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\InventoryPart;
use App\Models\Inventory;

class CheckInventoryData extends Command
{
  protected $signature = 'rebrickable:check-inventory {set_num} {part_num} {color_id}';
  protected $description = 'Check inventory part data for a specific set, part, and color';

  public function handle(): int
  {
    $setNum = $this->argument('set_num');
    $partNum = $this->argument('part_num');
    $colorId = $this->argument('color_id');

    $inventory = Inventory::where('set_num', $setNum)->first();

    if (!$inventory) {
      $this->error("Set {$setNum} not found");
      return 1;
    }

    $this->info("Checking set {$setNum} (Inventory ID: {$inventory->id})");
    $this->info("Part: {$partNum}, Color ID: {$colorId}");
    $this->newLine();

    $parts = InventoryPart::where('inventory_id', $inventory->id)
      ->where('part_num', $partNum)
      ->where('color_id', $colorId)
      ->get();

    $this->info("Found {$parts->count()} record(s):");
    $this->newLine();

    $total = 0;
    foreach ($parts as $part) {
      $spareText = $part->is_spare ? 'YES (Spare)' : 'NO';
      $this->line("  ID: {$part->id}");
      $this->line("  Quantity: {$part->quantity}");
      $this->line("  Is Spare: {$spareText}");
      $this->line("  ---");
      $total += $part->quantity;
    }

    $this->newLine();
    $this->info("Total Quantity: {$total}");

    return 0;
  }
}
