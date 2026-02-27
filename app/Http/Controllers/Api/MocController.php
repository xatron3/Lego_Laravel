<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Moc;
use App\Models\MocImage;
use App\Models\OrderItem;
use App\Models\Post;
use App\Models\PostImage;
use App\Models\Set;
use App\Models\Theme;
use App\Models\Inventory;
use App\Models\InventoryPart;
use App\Models\Part;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MocController extends Controller
{
  /**
   * Display a listing of public MOCs.
   */
  public function index(Request $request): JsonResponse
  {
    $query = Moc::with(['user:id,name,is_pro', 'set.theme', 'images'])
      ->visibleTo($request->user());

    // Filter by price type
    $filter = $request->input('filter', 'all');
    if ($filter === 'free') {
      $query->where(function ($q) {
        $q->whereNull('price')->orWhere('price', '<=', 0);
      });
    } elseif ($filter === 'paid') {
      $query->where('price', '>', 0);
    }

    // Search by name or description
    if ($search = $request->input('search')) {
      $query->where(function ($q) use ($search) {
        $q->where('name', 'like', "%{$search}%")
          ->orWhere('description', 'like', "%{$search}%");
      });
    }

    // Sorting with Pro promotion (Pro users' MOCs appear first)
    $sort = $request->input('sort', 'newest');
    $query->proPromoted(); // Pro MOCs always promoted to top
    switch ($sort) {
      case 'oldest':
        $query->oldest();
        break;
      case 'popular':
        $query->latest(); // TODO: Add popularity tracking
        break;
      case 'price_low':
        $query->orderByRaw('COALESCE(price, 0) ASC');
        break;
      case 'price_high':
        $query->orderByRaw('COALESCE(price, 0) DESC');
        break;
      case 'name':
        $query->orderBy('name');
        break;
      default:
        $query->latest();
    }

    $perPage = min($request->input('per_page', 24), 100);
    $mocs = $query->paginate($perPage);

    // Transform to include display thumbnail
    $mocs->getCollection()->transform(function ($moc) {
      $moc->display_thumbnail = $moc->display_thumbnail;
      return $moc;
    });

    return response()->json($mocs);
  }

  /**
   * Get the authenticated user's MOCs.
   */
  public function myMocs(Request $request): JsonResponse
  {
    $mocs = Moc::with(['user:id,name,is_pro', 'set.theme', 'images'])
      ->where('user_id', $request->user()->id)
      ->latest()
      ->get();

    $mocs->transform(function ($moc) {
      $moc->display_thumbnail = $moc->display_thumbnail;
      return $moc;
    });

    return response()->json($mocs);
  }

  /**
   * Check if user owns a MOC.
   */
  public function checkOwnership(Request $request, string $id): JsonResponse
  {
    $moc = Moc::findOrFail($id);
    $user = $request->user();

    $owns = false;
    $type = null;

    if ($moc->user_id === $user->id) {
      $owns = true;
      $type = 'creator';
    } elseif ($user->ownsMoc($moc)) {
      $owns = true;
      $pivot = $user->ownedMocs()->where('moc_id', $moc->id)->first()?->pivot;
      $type = $pivot?->type ?? 'owned';
    }

    return response()->json([
      'owns' => $owns,
      'type' => $type,
    ]);
  }

  /**
   * Claim a free MOC.
   */
  public function claim(Request $request, string $id): JsonResponse
  {
    $moc = Moc::findOrFail($id);
    $user = $request->user();

    // Check if model is free
    if (!$moc->isFree()) {
      return response()->json(['message' => 'This MOC is not free. Please purchase it.'], 422);
    }

    // Check if already owned
    if ($user->ownsMoc($moc)) {
      return response()->json(['message' => 'You already own this MOC.'], 422);
    }

    // Add to user's owned MOCs
    $user->ownedMocs()->attach($moc->id, [
      'type' => 'claimed',
      'price_paid' => 0,
    ]);

    return response()->json(['message' => 'MOC added to your library.']);
  }

  /**
   * Remove a claimed MOC from library.
   */
  public function unclaim(Request $request, string $id): JsonResponse
  {
    $moc = Moc::findOrFail($id);
    $user = $request->user();

    // Cannot unclaim if you're the creator
    if ($moc->user_id === $user->id) {
      return response()->json(['message' => 'Cannot unclaim your own MOC.'], 422);
    }

    // Check if claimed (not purchased)
    $pivot = $user->ownedMocs()->where('moc_id', $moc->id)->first()?->pivot;
    if (!$pivot) {
      return response()->json(['message' => 'You do not own this MOC.'], 422);
    }

    if ($pivot->type === 'purchased') {
      return response()->json(['message' => 'Cannot remove purchased MOCs from library.'], 422);
    }

    $user->ownedMocs()->detach($moc->id);

    return response()->json(['message' => 'MOC removed from your library.']);
  }

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
      'instructions_pdf' => 'required|file|mimes:pdf|max:51200',
      'total_steps' => 'integer|min:0',
      'is_public' => 'boolean',
      'price' => 'nullable|numeric|min:0',
      'thumbnail' => 'nullable|string',
      'share_to_feed' => 'nullable|boolean',
    ]);

    // Store PDF file
    $pdfPath = null;
    if ($request->hasFile('instructions_pdf')) {
      $pdfPath = $request->file('instructions_pdf')->store('moc-instructions', 'public');
    }

    // Get or create MOC theme
    $mocTheme = $this->getOrCreateMocTheme();

    // Generate unique set_num
    $setNum = $this->generateSetNum();

    DB::beginTransaction();
    try {
      // 1. Create Set record (catalog data)
      $set = Set::create([
        'set_num' => $setNum,
        'name' => $validated['name'],
        'year' => date('Y'),
        'theme_id' => $mocTheme->id,
        'num_parts' => 0,
      ]);

      // 2. Create MOC record (MOC-specific data)
      $moc = Moc::create([
        'name' => $validated['name'],
        'description' => $validated['description'] ?? null,
        'ldr_content' => $validated['ldr_content'],
        'file_name' => $validated['file_name'] ?? null,
        'instructions_pdf' => $pdfPath,
        'total_steps' => $validated['total_steps'] ?? 0,
        'total_parts' => 0,
        'price' => $validated['price'] ?? null,
        'is_public' => $validated['is_public'] ?? false,
        'thumbnail' => $validated['thumbnail'] ?? null,
        'user_id' => $request->user()->id,
        'set_num' => $setNum,
      ]);

      // 3. Generate inventory from LDR content
      $totalParts = $this->generateInventory($moc);

      // 4. Update part counts
      $set->update(['num_parts' => $totalParts]);
      $moc->update(['total_parts' => $totalParts]);

      // 5. Share to community feed if requested
      if ($validated['share_to_feed'] ?? false) {
        $this->shareMocToFeed($moc, $request->user());
      }

      DB::commit();

      return response()->json($moc->load('user:id,name,is_pro', 'set.theme', 'images'), 201);
    } catch (\Exception $e) {
      DB::rollBack();
      return response()->json(['message' => 'Failed to create MOC: ' . $e->getMessage()], 500);
    }
  }

  /**
   * Share a MOC to the community feed.
   */
  private function shareMocToFeed(Moc $moc, User $user): void
  {
    $post = Post::create([
      'user_id' => $user->id,
      'type' => 'moc',
      'title' => $moc->name,
      'body' => $moc->description,
      'visibility' => 'public',
      'metadata' => [
        'moc_id' => $moc->id,
        'set_num' => $moc->set_num,
        'price' => $moc->price,
        'total_parts' => $moc->total_parts,
        'total_steps' => $moc->total_steps,
      ],
    ]);

    // Link MOC images to the post
    $mocImages = $moc->images()->get();
    foreach ($mocImages as $index => $mocImage) {
      PostImage::create([
        'post_id' => $post->id,
        'path' => $mocImage->path,
        'filename' => $mocImage->filename ?? 'image.jpg',
        'sort_order' => $index,
      ]);
    }
  }

  /**
   * Display the specified MOC.
   */
  public function show(Request $request, string $id): JsonResponse
  {
    $moc = Moc::with(['user:id,name,is_pro', 'set.theme', 'images', 'inventories.parts.part.category', 'inventories.parts.color'])
      ->findOrFail($id);

    // Check access
    if (!$moc->canBeAccessedBy($request->user())) {
      return response()->json(['message' => 'MOC not found or access denied.'], 404);
    }

    // Aggregate parts from inventories
    $parts = $this->aggregateParts($moc);
    $moc->parts = $parts;
    $moc->parts_count = count($parts);

    // Add display thumbnail
    $moc->display_thumbnail = $moc->display_thumbnail;

    // Check if this is a Pro demo model (publicly accessible for demonstration)
    $proDemoMocIds = \App\Models\SiteSetting::getValue('pro_demo_moc_ids', []);
    $isDemoModel = in_array($moc->id, $proDemoMocIds);

    // Hide LDR content if user doesn't have access AND it's not a demo model
    if (!$isDemoModel && !$moc->canAccessContent($request->user())) {
      $moc->makeHidden('ldr_content');
    } else {
      $moc->makeVisible('ldr_content');
    }

    // Check 3D viewer access for free MOCs
    $canAccessViewer = false;
    if ($request->user()) {
      $canAccessViewer = $request->user()->canAccessViewer($moc);
    }
    $moc->can_access_viewer = $canAccessViewer;

    // Clean up loaded relations
    unset($moc->inventories);

    return response()->json($moc);
  }

  /**
   * Update an existing MOC.
   */
  public function update(Request $request, string $id): JsonResponse
  {
    $moc = Moc::with('set')->findOrFail($id);

    // Check ownership
    if ($moc->user_id !== $request->user()->id && !$request->user()->canModerate()) {
      return response()->json(['message' => 'Unauthorized.'], 403);
    }

    $validated = $request->validate([
      'name' => 'sometimes|required|string|max:255',
      'description' => 'nullable|string',
      'ldr_content' => 'sometimes|required|string',
      'file_name' => 'nullable|string|max:255',
      'instructions_pdf' => 'sometimes|file|mimes:pdf|max:51200',
      'total_steps' => 'integer|min:0',
      'is_public' => 'boolean',
      'price' => 'nullable|numeric|min:0',
      'thumbnail' => 'nullable|string',
    ]);

    // Handle PDF update
    if ($request->hasFile('instructions_pdf')) {
      // Delete old PDF if exists
      if ($moc->instructions_pdf) {
        Storage::disk('public')->delete($moc->instructions_pdf);
      }
      $validated['instructions_pdf'] = $request->file('instructions_pdf')->store('moc-instructions', 'public');
    }

    DB::beginTransaction();
    try {
      $ldrUpdated = isset($validated['ldr_content']) && $validated['ldr_content'] !== $moc->ldr_content;

      // Update MOC
      $moc->update($validated);

      // Update Set name if changed
      if (isset($validated['name']) && $moc->set) {
        $moc->set->update(['name' => $validated['name']]);
      }

      // Regenerate inventory if LDR changed
      if ($ldrUpdated) {
        $totalParts = $this->generateInventory($moc, true);
        $moc->update(['total_parts' => $totalParts]);
        if ($moc->set) {
          $moc->set->update(['num_parts' => $totalParts]);
        }
      }

      DB::commit();

      return response()->json($moc->load('user:id,name,is_pro', 'set.theme', 'images'));
    } catch (\Exception $e) {
      DB::rollBack();
      return response()->json(['message' => 'Failed to update MOC: ' . $e->getMessage()], 500);
    }
  }

  /**
   * Delete a MOC.
   */
  public function destroy(Request $request, string $id): JsonResponse
  {
    $moc = Moc::with('set', 'images')->findOrFail($id);

    if ($moc->user_id !== $request->user()->id && !$request->user()->canModerate()) {
      return response()->json(['message' => 'Unauthorized.'], 403);
    }

    // Check if MOC has been sold
    $hasSales = OrderItem::where('moc_id', $moc->id)
      ->whereHas('order', function ($query) {
        $query->where('status', 'completed');
      })
      ->exists();

    if ($hasSales && !$moc->isFree()) {
      return response()->json([
        'message' => 'Cannot delete this MOC because it has been sold. Customers have purchased this content and need continued access.'
      ], 422);
    }

    DB::beginTransaction();
    try {
      // Delete images (will also delete files via model event)
      $moc->images()->delete();

      // Delete inventory
      if ($moc->set_num) {
        $inventory = Inventory::where('set_num', $moc->set_num)->first();
        if ($inventory) {
          InventoryPart::where('inventory_id', $inventory->id)->delete();
          $inventory->delete();
        }
      }

      // Delete Set record
      if ($moc->set) {
        $moc->set->delete();
      }

      // Delete MOC
      $moc->delete();

      DB::commit();

      return response()->json(['message' => 'MOC deleted successfully.']);
    } catch (\Exception $e) {
      DB::rollBack();
      return response()->json(['message' => 'Failed to delete MOC: ' . $e->getMessage()], 500);
    }
  }

  /**
   * Upload images for a MOC.
   */
  public function uploadImages(Request $request, string $id): JsonResponse
  {
    $moc = Moc::with('images', 'set')->findOrFail($id);

    if ($moc->user_id !== $request->user()->id && !$request->user()->canModerate()) {
      return response()->json(['message' => 'Unauthorized.'], 403);
    }

    $request->validate([
      'images' => 'required|array|min:1|max:' . MocImage::MAX_IMAGES_PER_MOC,
      'images.*' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
    ]);

    // Check current image count
    $currentCount = $moc->images()->count();
    $newCount = count($request->file('images'));

    if ($currentCount + $newCount > MocImage::MAX_IMAGES_PER_MOC) {
      return response()->json([
        'message' => "Maximum " . MocImage::MAX_IMAGES_PER_MOC . " images allowed. You have {$currentCount} and are trying to add {$newCount}."
      ], 422);
    }

    $uploadedImages = [];
    $nextSortOrder = $moc->images()->max('sort_order') + 1;
    $isPrimary = $currentCount === 0; // First image becomes primary
    $firstImagePath = null;

    foreach ($request->file('images') as $file) {
      $path = $file->store('moc-images/' . $moc->id, 'public');

      // Remember the first uploaded image path for thumbnail
      if ($firstImagePath === null) {
        $firstImagePath = $path;
      }

      $image = MocImage::create([
        'moc_id' => $moc->id,
        'path' => $path,
        'filename' => $file->getClientOriginalName(),
        'sort_order' => $nextSortOrder++,
        'is_primary' => $isPrimary,
      ]);

      $isPrimary = false; // Only first is primary
      $uploadedImages[] = $image;
    }

    // Update MOC thumbnail if this is the first image upload
    // This provides a fallback for rebrickable CDN
    if ($currentCount === 0 && $firstImagePath) {
      $moc->update(['thumbnail' => $firstImagePath]);
    }

    return response()->json([
      'message' => 'Images uploaded successfully.',
      'images' => $uploadedImages,
    ]);
  }

  /**
   * Delete an image from a MOC.
   */
  public function deleteImage(Request $request, string $id, string $imageId): JsonResponse
  {
    $moc = Moc::findOrFail($id);

    if ($moc->user_id !== $request->user()->id && !$request->user()->canModerate()) {
      return response()->json(['message' => 'Unauthorized.'], 403);
    }

    $image = MocImage::where('moc_id', $moc->id)->where('id', $imageId)->firstOrFail();

    $wasPrimary = $image->is_primary;
    $image->delete();

    // If deleted image was primary, make another one primary and update thumbnail
    if ($wasPrimary) {
      $nextImage = MocImage::where('moc_id', $moc->id)->orderBy('sort_order')->first();
      if ($nextImage) {
        $nextImage->update(['is_primary' => true]);
        $moc->update(['thumbnail' => $nextImage->path]);
      } else {
        // No more images, clear thumbnail
        $moc->update(['thumbnail' => null]);
      }
    }

    return response()->json(['message' => 'Image deleted successfully.']);
  }

  /**
   * Set primary image for a MOC.
   */
  public function setPrimaryImage(Request $request, string $id, string $imageId): JsonResponse
  {
    $moc = Moc::findOrFail($id);

    if ($moc->user_id !== $request->user()->id && !$request->user()->canModerate()) {
      return response()->json(['message' => 'Unauthorized.'], 403);
    }

    $image = MocImage::where('moc_id', $moc->id)->where('id', $imageId)->firstOrFail();

    // Remove primary from all other images
    MocImage::where('moc_id', $moc->id)->update(['is_primary' => false]);

    // Set this one as primary
    $image->update(['is_primary' => true]);

    // Update MOC thumbnail
    $moc->update(['thumbnail' => $image->path]);

    return response()->json(['message' => 'Primary image updated.']);
  }

  /**
   * Reorder images for a MOC.
   */
  public function reorderImages(Request $request, string $id): JsonResponse
  {
    $moc = Moc::findOrFail($id);

    if ($moc->user_id !== $request->user()->id && !$request->user()->canModerate()) {
      return response()->json(['message' => 'Unauthorized.'], 403);
    }

    $request->validate([
      'image_ids' => 'required|array',
      'image_ids.*' => 'required|integer|exists:moc_images,id',
    ]);

    $imageIds = $request->input('image_ids');

    foreach ($imageIds as $index => $imageId) {
      MocImage::where('id', $imageId)->where('moc_id', $moc->id)->update([
        'sort_order' => $index,
      ]);
    }

    // Update thumbnail to the first image in the new order
    if (!empty($imageIds)) {
      $firstImage = MocImage::find($imageIds[0]);
      if ($firstImage) {
        // Set first image as primary
        MocImage::where('moc_id', $moc->id)->update(['is_primary' => false]);
        $firstImage->update(['is_primary' => true]);
        $moc->update(['thumbnail' => $firstImage->path]);
      }
    }

    return response()->json(['message' => 'Images reordered successfully.']);
  }

  // ==================== Helper Methods ====================

  /**
   * Get or create the MOC theme.
   */
  protected function getOrCreateMocTheme(): Theme
  {
    $mocTheme = Theme::where('name', 'My Own Creations (MOCs)')->first();

    if (!$mocTheme) {
      $maxId = Theme::max('id') ?? 0;
      $mocTheme = Theme::create([
        'id' => $maxId + 1,
        'name' => 'My Own Creations (MOCs)',
        'parent_id' => null,
      ]);
    }

    return $mocTheme;
  }

  /**
   * Generate a unique set_num for MOCs.
   */
  protected function generateSetNum(): string
  {
    $lastSet = Set::where('set_num', 'LIKE', 'MOC-%')
      ->orderByRaw("CAST(SUBSTR(set_num, 5) AS INTEGER) DESC")
      ->first();

    $nextNum = 1;
    if ($lastSet) {
      preg_match('/MOC-(\d+)/', $lastSet->set_num, $matches);
      $nextNum = ((int) $matches[1]) + 1;
    }

    return 'MOC-' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);
  }

  /**
   * Generate inventory from LDR content.
   */
  protected function generateInventory(Moc $moc, bool $force = false): int
  {
    $existingInventory = Inventory::where('set_num', $moc->set_num)->first();

    if ($existingInventory && !$force) {
      return $moc->total_parts;
    }

    if ($existingInventory) {
      InventoryPart::where('inventory_id', $existingInventory->id)->delete();
      $existingInventory->delete();
    }

    if (empty($moc->ldr_content)) {
      return 0;
    }

    $parts = $this->parseLdrFile($moc->ldr_content);

    if (empty($parts)) {
      return 0;
    }

    $nextId = (Inventory::max('id') ?? 0) + 1;
    $inventory = Inventory::create([
      'id' => $nextId,
      'set_num' => $moc->set_num,
      'version' => 1,
    ]);

    $createdParts = 0;
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

      $createdParts += $partData['quantity'];
    }

    return $createdParts;
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

  /**
   * Aggregate parts from inventories with image URLs.
   */
  protected function aggregateParts(Moc $moc): array
  {
    $partsMap = [];

    foreach ($moc->inventories as $inventory) {
      foreach ($inventory->parts as $invPart) {
        $key = $invPart->part_num . '-' . $invPart->color_id;

        if (!isset($partsMap[$key])) {
          $element = $invPart->part?->elements()->where('color_id', $invPart->color_id)->first();
          $partsMap[$key] = [
            'part_num' => $invPart->part_num,
            'name' => $invPart->part?->name ?? 'Unknown',
            'category' => $invPart->part?->category?->name ?? 'Unknown',
            'color_id' => $invPart->color_id,
            'color_name' => $invPart->color?->name ?? 'Unknown',
            'color_rgb' => $invPart->color?->rgb ?? '000000',
            'quantity' => 0,
            'is_spare' => $invPart->is_spare,
            'image_url' => "https://cdn.brickoasis.com/images/parts/{$invPart->color_id}/{$invPart->part_num}.png",
            'photo_url' => $element ? "https://cdn.rebrickable.com/media/parts/elements/{$element->element_id}.jpg" : null,
            'bricklink_url' => "https://www.bricklink.com/v2/catalog/catalogitem.page?P={$invPart->part_num}&C={$invPart->color_id}",
          ];
        }

        $partsMap[$key]['quantity'] += $invPart->quantity;
      }
    }

    // Sort by quantity descending
    $parts = array_values($partsMap);
    usort($parts, fn($a, $b) => $b['quantity'] - $a['quantity']);

    return $parts;
  }

  /**
   * Download MOC instructions PDF.
   */
  public function downloadInstructions(Request $request, string $id)
  {
    $moc = Moc::findOrFail($id);
    $user = $request->user();

    // Check if instructions exist
    if (!$moc->instructions_pdf) {
      return response()->json(['message' => 'No instructions available for this MOC.'], 404);
    }

    // Check access permissions
    // Free MOCs: anyone can download
    // Paid MOCs: must be creator or have purchased
    if (!$moc->isFree()) {
      if (!$user) {
        return response()->json(['message' => 'Authentication required.'], 401);
      }

      if ($moc->user_id !== $user->id && !$user->ownsMoc($moc)) {
        return response()->json(['message' => 'You must purchase this MOC to download instructions.'], 403);
      }
    }

    // Get file path
    $filePath = storage_path('app/public/' . $moc->instructions_pdf);

    if (!file_exists($filePath)) {
      return response()->json(['message' => 'Instructions file not found.'], 404);
    }

    // Generate download filename
    $downloadName = str_replace(' ', '_', $moc->name) . '_Instructions.pdf';

    return response()->download($filePath, $downloadName, [
      'Content-Type' => 'application/pdf',
    ]);
  }
}
