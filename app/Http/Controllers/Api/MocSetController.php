<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MocSet;
use App\Models\Theme;
use App\Models\Inventory;
use App\Models\InventoryPart;
use App\Models\Part;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MocSetController extends Controller
{
  /**
   * Store a newly created MOC.
   */
  public function store(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'description' => 'nullable|string',
      'ldr_content' => 'required|string',
      'file_name' => 'nullable|string|max:255',
      'total_steps' => 'integer|min:0',
      'is_public' => 'boolean',
      'price' => 'nullable|numeric|min:0',
      'thumbnail' => 'nullable|string',
    ]);

    // Get or create MOC theme
    $mocTheme = Theme::where('name', 'My Own Creations (MOCs)')->first();
    if (!$mocTheme) {
      $maxId = Theme::max('id') ?? 0;
      $mocTheme = Theme::create([
        'id' => $maxId + 1,
        'name' => 'My Own Creations (MOCs)',
        'parent_id' => null,
      ]);
    }

    // Generate unique set_num
    $lastMoc = MocSet::where('set_num', 'LIKE', 'MOC-%')->orderBy('set_num', 'desc')->first();
    $nextNum = 1;
    if ($lastMoc) {
      preg_match('/MOC-(\d+)/', $lastMoc->set_num, $matches);
      $nextNum = ((int) $matches[1]) + 1;
    }
    $setNum = 'MOC-' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);

    DB::beginTransaction();
    try {
      // Create MOC
      $moc = MocSet::create([
        'set_num' => $setNum,
        'name' => $validated['name'],
        'description' => $validated['description'] ?? null,
        'year' => date('Y'),
        'theme_id' => $mocTheme->id,
        'num_parts' => 0,
        'ldr_content' => $validated['ldr_content'],
        'file_name' => $validated['file_name'] ?? null,
        'total_steps' => $validated['total_steps'] ?? 0,
        'price' => $validated['price'] ?? null,
        'is_public' => $validated['is_public'] ?? false,
        'thumbnail' => $validated['thumbnail'] ?? null,
        'user_id' => $request->user()->id,
      ]);

      // Generate inventory from LDR content
      $this->generateInventory($moc);

      DB::commit();

      return response()->json($moc->load('user:id,name', 'theme'), 201);
    } catch (\Exception $e) {
      DB::rollBack();
      return response()->json(['message' => 'Failed to create MOC: ' . $e->getMessage()], 500);
    }
  }

  /**
   * Update an existing MOC.
   */
  public function update(Request $request, string $setNum): JsonResponse
  {
    $moc = MocSet::where('set_num', $setNum)->firstOrFail();

    // Check ownership
    if ($moc->user_id !== $request->user()->id && !$request->user()->canModerate()) {
      return response()->json(['message' => 'Unauthorized.'], 403);
    }

    $validated = $request->validate([
      'name' => 'sometimes|required|string|max:255',
      'description' => 'nullable|string',
      'ldr_content' => 'sometimes|required|string',
      'file_name' => 'nullable|string|max:255',
      'total_steps' => 'integer|min:0',
      'is_public' => 'boolean',
      'price' => 'nullable|numeric|min:0',
      'thumbnail' => 'nullable|string',
    ]);

    DB::beginTransaction();
    try {
      $ldrUpdated = isset($validated['ldr_content']) && $validated['ldr_content'] !== $moc->ldr_content;

      $moc->update($validated);

      // Regenerate inventory if LDR changed
      if ($ldrUpdated) {
        $this->generateInventory($moc, true);
      }

      DB::commit();

      return response()->json($moc->load('user:id,name', 'theme'));
    } catch (\Exception $e) {
      DB::rollBack();
      return response()->json(['message' => 'Failed to update MOC: ' . $e->getMessage()], 500);
    }
  }

  /**
   * Delete a MOC.
   */
  public function destroy(Request $request, string $setNum): JsonResponse
  {
    $moc = MocSet::where('set_num', $setNum)->firstOrFail();

    if ($moc->user_id !== $request->user()->id && !$request->user()->canModerate()) {
      return response()->json(['message' => 'Unauthorized.'], 403);
    }

    $moc->delete();

    return response()->json(['message' => 'MOC deleted successfully.']);
  }

  /**
   * Generate inventory from LDR content.
   */
  protected function generateInventory(MocSet $moc, bool $force = false): void
  {
    $existingInventory = Inventory::where('set_num', $moc->set_num)->first();

    if ($existingInventory && !$force) {
      return;
    }

    if ($existingInventory) {
      InventoryPart::where('inventory_id', $existingInventory->id)->delete();
      $existingInventory->delete();
    }

    if (empty($moc->ldr_content)) {
      return;
    }

    $parts = $this->parseLdrFile($moc->ldr_content);

    if (empty($parts)) {
      return;
    }

    $nextId = Inventory::max('id') + 1;
    $inventory = Inventory::create([
      'id' => $nextId,
      'set_num' => $moc->set_num,
      'version' => 1,
    ]);

    foreach ($parts as $partData) {
      $part = Part::where('part_num', $partData['part_num'])->first();

      if (!$part) {
        continue;
      }

      $colorId = $partData['color_id'];
      if ($colorId == 0) {
        $colorId = 1;
      }

      if (!\App\Models\Color::where('id', $colorId)->exists()) {
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

    $totalParts = array_sum(array_column($parts, 'quantity'));
    $moc->update(['num_parts' => $totalParts]);
  }

  /**
   * Parse LDR file content.
   */
  protected function parseLdrFile(string $ldrContent): array
  {
    $lines = preg_split('/\r?\n/', $ldrContent);
    $partCounts = [];

    foreach ($lines as $line) {
      $line = trim($line);

      if (preg_match('/^1\s+(\d+)\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+[\d\.\-]+\s+(.+\.dat)/i', $line, $matches)) {
        $colorId = (int) $matches[1];
        $partFile = $matches[2];

        $partNum = preg_replace('/\.dat$/i', '', basename($partFile));

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
