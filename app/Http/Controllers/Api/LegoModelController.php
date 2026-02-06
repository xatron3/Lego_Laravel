<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegoModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class LegoModelController extends Controller
{
  /**
   * Display a listing of public models (store page).
   * Shows public models that users can claim/purchase.
   */
  public function index(Request $request): JsonResponse
  {
    $user = $request->user();

    // Only show public models
    $models = LegoModel::where('is_public', true)
      ->with('user:id,name')
      ->latest()
      ->get(['id', 'name', 'description', 'file_name', 'total_steps', 'total_parts', 'user_id', 'is_public', 'price', 'thumbnail', 'created_at']);

    return response()->json($models);
  }

  /**
   * Get models owned by the authenticated user.
   */
  public function myModels(Request $request): JsonResponse
  {
    $models = $request->user()
      ->legoModels()
      ->latest()
      ->get(['id', 'name', 'description', 'file_name', 'total_steps', 'total_parts', 'is_public', 'price', 'thumbnail', 'created_at']);

    return response()->json($models);
  }

  /**
   * Store a newly created resource in storage.
   */
  public function store(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'name' => 'required|string|max:255',
      'description' => 'nullable|string',
      'ldr_content' => 'required|string',
      'file_name' => 'nullable|string|max:255',
      'total_steps' => 'integer|min:0',
      'total_parts' => 'integer|min:0',
      'is_public' => 'boolean',
      'price' => 'nullable|numeric|min:0',
    ]);

    // Associate with authenticated user if logged in
    if ($request->user()) {
      $validated['user_id'] = $request->user()->id;
    }

    // Set default visibility
    if (!isset($validated['is_public'])) {
      $validated['is_public'] = false;
    }

    $model = LegoModel::create($validated);

    return response()->json($model->load('user:id,name'), 201);
  }

  /**
   * Display the specified resource.
   * Public models can be viewed by anyone (for claiming), but LDR content requires access.
   */
  public function show(Request $request, string $id): JsonResponse
  {
    $legoModel = LegoModel::findOrFail($id);

    // Check if user can view this model's details
    if (!$legoModel->canBeAccessedBy($request->user())) {
      return response()->json(['message' => 'Model not found or access denied.'], 404);
    }

    $model = $legoModel->load('user:id,name');

    // Load inventory parts if set_num exists
    if ($model->set_num) {
      $model->load(['inventories.parts.part.category', 'inventories.parts.color']);

      // Aggregate parts from all inventories
      $partsMap = [];
      foreach ($model->inventories as $inventory) {
        foreach ($inventory->parts as $invPart) {
          $key = $invPart->part_num . '-' . $invPart->color_id;
          if (!isset($partsMap[$key])) {
            // Get element for this part+color combination
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
              'image_url' => $this->getPartImageUrl($invPart->part_num, $invPart->color_id),
              'photo_url' => $element ? $this->getPartPhotoUrl($element->element_id) : null,
              'bricklink_url' => $this->getPartBricklinkUrl($invPart->part_num, $invPart->color_id),
            ];
          }
          $partsMap[$key]['quantity'] += $invPart->quantity;
        }
      }

      // Sort parts by quantity descending
      $parts = array_values($partsMap);
      usort($parts, fn($a, $b) => $b['quantity'] - $a['quantity']);

      // Unload inventories to clean up response
      unset($model->inventories);

      $model->parts = $parts;
      $model->parts_count = count($parts);
    }

    // Check if this is a Pro demo model (publicly accessible for demonstration)
    $proDemoMocIds = \App\Models\SiteSetting::getValue('pro_demo_moc_ids', []);
    $isDemoModel = in_array($legoModel->id, $proDemoMocIds);

    // If user doesn't have content access AND it's not a demo model, remove LDR content from response
    if (!$isDemoModel && !$legoModel->canAccessContent($request->user())) {
      $model->makeHidden('ldr_content');
    }

    return response()->json($model);
  }

  /**
   * Helper methods for Rebrickable CDN URLs
   */
  private function getPartImageUrl(string $partNum, int $colorId): string
  {
    return "https://cdn.rebrickable.com/media/parts/ldraw/{$colorId}/{$partNum}.png";
  }

  private function getPartPhotoUrl(string $elementId): string
  {
    return "https://cdn.rebrickable.com/media/parts/elements/{$elementId}.jpg";
  }

  private function getPartBricklinkUrl(string $partNum, int $colorId): string
  {
    return "https://www.bricklink.com/v2/catalog/catalogitem.page?P={$partNum}&idColor={$colorId}";
  }

  /**
   * Update the specified resource in storage.
   */
  public function update(Request $request, string $id): JsonResponse
  {
    $legoModel = LegoModel::findOrFail($id);

    // Check ownership or admin status
    $user = $request->user();
    if (!$user || ($legoModel->user_id !== $user->id && !$user->canModerate())) {
      return response()->json(['message' => 'Unauthorized.'], 403);
    }

    $validated = $request->validate([
      'name' => 'sometimes|required|string|max:255',
      'description' => 'nullable|string',
      'ldr_content' => 'sometimes|required|string',
      'file_name' => 'nullable|string|max:255',
      'total_steps' => 'integer|min:0',
      'total_parts' => 'integer|min:0',
      'is_public' => 'boolean',
      'price' => 'nullable|numeric|min:0',
    ]);

    $legoModel->update($validated);

    return response()->json($legoModel->fresh()->load('user:id,name'));
  }

  /**
   * Remove the specified resource from storage.
   */
  public function destroy(Request $request, string $id): JsonResponse
  {
    $legoModel = LegoModel::findOrFail($id);

    // Check ownership or admin status
    $user = $request->user();
    if (!$user || ($legoModel->user_id !== $user->id && !$user->canModerate())) {
      return response()->json(['message' => 'Unauthorized.'], 403);
    }

    $legoModel->delete();

    return response()->json(null, 204);
  }

  /**
   * Check if the authenticated user owns a specific model.
   */
  public function checkOwnership(Request $request, string $id): JsonResponse
  {
    $legoModel = LegoModel::findOrFail($id);
    $user = $request->user();

    // Creator always owns the model
    if ($legoModel->user_id === $user->id) {
      return response()->json([
        'owns' => true,
        'type' => 'created',
      ]);
    }

    // Check if user has claimed/purchased
    $ownership = $user->ownedModels()->where('lego_model_id', $legoModel->id)->first();

    if ($ownership) {
      return response()->json([
        'owns' => true,
        'type' => $ownership->pivot->type,
      ]);
    }

    return response()->json([
      'owns' => false,
      'type' => null,
    ]);
  }

  /**
   * Claim a free model for the authenticated user.
   */
  public function claim(Request $request, string $id): JsonResponse
  {
    $legoModel = LegoModel::findOrFail($id);
    $user = $request->user();

    // Check if model is public and free
    if (!$legoModel->is_public) {
      return response()->json(['message' => 'This model is not available for claiming.'], 403);
    }

    if (!$legoModel->isFree()) {
      return response()->json(['message' => 'This model is not free. Please purchase it.'], 403);
    }

    // Check if user already owns it
    if ($user->ownsModel($legoModel)) {
      return response()->json(['message' => 'You already own this model.'], 400);
    }

    // Add to user's owned models
    $user->ownedModels()->attach($legoModel->id, [
      'type' => 'claimed',
      'price_paid' => null,
    ]);

    return response()->json([
      'message' => 'Model added to your library successfully.',
      'owns' => true,
      'type' => 'claimed',
    ]);
  }

  /**
   * Remove a claimed model from the authenticated user's library.
   */
  public function unclaim(Request $request, string $id): JsonResponse
  {
    $legoModel = LegoModel::findOrFail($id);
    $user = $request->user();

    // Check if user owns this model
    $ownership = $user->ownedModels()->where('lego_model_id', $legoModel->id)->first();

    if (!$ownership) {
      return response()->json(['message' => 'You do not own this model.'], 404);
    }

    // Only allow unclaiming claimed models (not created ones)
    if ($ownership->pivot->type !== 'claimed') {
      return response()->json(['message' => 'Cannot remove purchased or created models this way.'], 403);
    }

    // Remove from user's owned models
    $user->ownedModels()->detach($legoModel->id);

    return response()->json([
      'message' => 'Model removed from your library successfully.',
      'owns' => false,
    ]);
  }

  /**
   * Upload a thumbnail for a model.
   */
  public function uploadThumbnail(Request $request, string $id): JsonResponse
  {
    $legoModel = LegoModel::findOrFail($id);

    // Check ownership or admin status
    $user = $request->user();
    if (!$user || ($legoModel->user_id !== $user->id && !$user->canModerate())) {
      return response()->json(['message' => 'Unauthorized.'], 403);
    }

    $validated = $request->validate([
      'thumbnail' => 'required|string', // Base64 image data
    ]);

    // Extract base64 data
    $imageData = $validated['thumbnail'];

    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
      $imageData = substr($imageData, strpos($imageData, ',') + 1);
      $extension = $matches[1];
    } else {
      $extension = 'png';
    }

    // Decode base64
    $decodedImage = base64_decode($imageData);
    if ($decodedImage === false) {
      return response()->json(['message' => 'Invalid image data.'], 400);
    }

    // Generate unique filename
    $filename = 'thumbnails/' . $legoModel->id . '_' . time() . '.' . $extension;

    // Store in public disk
    Storage::disk('public')->put($filename, $decodedImage);

    // Delete old thumbnail if exists
    if ($legoModel->thumbnail) {
      Storage::disk('public')->delete($legoModel->thumbnail);
    }

    // Update model with new thumbnail path
    $legoModel->update([
      'thumbnail' => $filename,
    ]);

    return response()->json([
      'message' => 'Thumbnail uploaded successfully.',
      'thumbnail' => $legoModel->thumbnail,
      'thumbnail_url' => asset('storage/' . $filename),
    ]);
  }
}
