<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Minifig;
use App\Models\Part;
use App\Models\Set;
use App\Models\Theme;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminCatalogController extends Controller
{
  /**
   * Model configuration for each entity type.
   */
  private array $entityConfig = [
    'sets' => [
      'model' => Set::class,
      'primaryKey' => 'set_num',
      'searchColumns' => ['set_num', 'name'],
      'imageDir' => 'catalog-images/sets',
      'validationRules' => [
        'set_num' => 'required|string|max:20',
        'name' => 'required|string|max:256',
        'year' => 'required|integer|min:1932|max:2100',
        'theme_id' => 'required|integer|exists:themes,id',
        'num_parts' => 'required|integer|min:0',
      ],
    ],
    'parts' => [
      'model' => Part::class,
      'primaryKey' => 'part_num',
      'searchColumns' => ['part_num', 'name'],
      'imageDir' => 'catalog-images/parts',
      'validationRules' => [
        'part_num' => 'required|string|max:20',
        'name' => 'required|string|max:250',
        'part_cat_id' => 'required|integer|exists:part_categories,id',
      ],
    ],
    'minifigs' => [
      'model' => Minifig::class,
      'primaryKey' => 'fig_num',
      'searchColumns' => ['fig_num', 'name'],
      'imageDir' => 'catalog-images/minifigs',
      'validationRules' => [
        'fig_num' => 'required|string|max:20',
        'name' => 'required|string|max:256',
        'num_parts' => 'required|integer|min:0',
      ],
    ],
    'themes' => [
      'model' => Theme::class,
      'primaryKey' => 'id',
      'searchColumns' => ['name'],
      'imageDir' => 'catalog-images/themes',
      'validationRules' => [
        'id' => 'required|integer',
        'name' => 'required|string|max:40',
        'parent_id' => 'nullable|integer',
      ],
    ],
  ];

  /**
   * List records with search and pagination.
   */
  public function index(Request $request, string $type): JsonResponse
  {
    $config = $this->getConfig($type);
    if (!$config) {
      return response()->json(['message' => 'Invalid entity type.'], 400);
    }

    $query = $config['model']::query();

    // Load relations
    if ($type === 'sets') {
      $query->with('theme');
    } elseif ($type === 'parts') {
      $query->with('category');
    } elseif ($type === 'themes') {
      $query->with('parent')->withCount('sets');
    }

    // Search
    if ($search = $request->get('search')) {
      $query->where(function ($q) use ($search, $config) {
        foreach ($config['searchColumns'] as $column) {
          $q->orWhere($column, 'like', "%{$search}%");
        }
      });
    }

    // Sorting
    $sortBy = $request->get('sort', $config['primaryKey']);
    $sortDir = $request->get('direction', 'asc');
    $query->orderBy($sortBy, $sortDir);

    $perPage = min($request->get('per_page', 25), 100);

    $result = $query->paginate($perPage);

    // Add image URLs
    $result->getCollection()->transform(function ($item) use ($type) {
      $item->image_url = $this->getImageUrl($type, $item);
      return $item;
    });

    return response()->json($result);
  }

  /**
   * Get a single record.
   */
  public function show(string $type, string $id): JsonResponse
  {
    $config = $this->getConfig($type);
    if (!$config) {
      return response()->json(['message' => 'Invalid entity type.'], 400);
    }

    $query = $config['model']::query();

    if ($type === 'sets') {
      $query->with('theme');
    } elseif ($type === 'parts') {
      $query->with('category');
    } elseif ($type === 'themes') {
      $query->with(['parent', 'children'])->withCount('sets');
    }

    $model = $query->find($id);

    if (!$model) {
      return response()->json(['message' => 'Record not found.'], 404);
    }

    $model->image_url = $this->getImageUrl($type, $model);

    return response()->json($model);
  }

  /**
   * Create a new record.
   */
  public function store(Request $request, string $type): JsonResponse
  {
    $config = $this->getConfig($type);
    if (!$config) {
      return response()->json(['message' => 'Invalid entity type.'], 400);
    }

    $validated = $request->validate($config['validationRules']);

    // Check for duplicate primary key
    $pk = $config['primaryKey'];
    if (isset($validated[$pk]) && $config['model']::find($validated[$pk])) {
      return response()->json([
        'message' => "A record with this {$pk} already exists.",
      ], 422);
    }

    try {
      $model = $config['model']::create($validated);
      $model->image_url = $this->getImageUrl($type, $model);
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
   * Update an existing record.
   */
  public function update(Request $request, string $type, string $id): JsonResponse
  {
    $config = $this->getConfig($type);
    if (!$config) {
      return response()->json(['message' => 'Invalid entity type.'], 400);
    }

    $model = $config['model']::find($id);
    if (!$model) {
      return response()->json(['message' => 'Record not found.'], 404);
    }

    // Make all rules optional for updates (except primary key which shouldn't change)
    $rules = [];
    foreach ($config['validationRules'] as $field => $rule) {
      if ($field === $config['primaryKey']) continue;
      $rules[$field] = str_replace('required|', 'sometimes|', $rule);
    }

    $validated = $request->validate($rules);
    $model->update($validated);

    $model = $model->fresh();
    $model->image_url = $this->getImageUrl($type, $model);

    return response()->json([
      'message' => 'Record updated successfully.',
      'data' => $model,
    ]);
  }

  /**
   * Delete a record.
   */
  public function destroy(string $type, string $id): JsonResponse
  {
    $config = $this->getConfig($type);
    if (!$config) {
      return response()->json(['message' => 'Invalid entity type.'], 400);
    }

    $model = $config['model']::find($id);
    if (!$model) {
      return response()->json(['message' => 'Record not found.'], 404);
    }

    // Delete custom image if exists
    if ($model->custom_image) {
      Storage::disk('public')->delete($model->custom_image);
    }

    try {
      $model->delete();
      return response()->json(['message' => 'Record deleted successfully.']);
    } catch (\Exception $e) {
      return response()->json([
        'message' => 'Cannot delete record. It may be referenced by other data: ' . $e->getMessage(),
      ], 422);
    }
  }

  /**
   * Upload a custom image for a record.
   */
  public function uploadImage(Request $request, string $type, string $id): JsonResponse
  {
    $config = $this->getConfig($type);
    if (!$config) {
      return response()->json(['message' => 'Invalid entity type.'], 400);
    }

    $model = $config['model']::find($id);
    if (!$model) {
      return response()->json(['message' => 'Record not found.'], 404);
    }

    $request->validate([
      'image' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120', // 5MB max
    ]);

    // Delete old custom image if exists
    if ($model->custom_image) {
      Storage::disk('public')->delete($model->custom_image);
    }

    // Store new image
    $path = $request->file('image')->store($config['imageDir'], 'public');
    $model->custom_image = $path;
    $model->save();

    return response()->json([
      'message' => 'Image uploaded successfully.',
      'image_url' => "/storage/{$path}",
      'custom_image' => $path,
    ]);
  }

  /**
   * Delete a custom image for a record.
   */
  public function deleteImage(string $type, string $id): JsonResponse
  {
    $config = $this->getConfig($type);
    if (!$config) {
      return response()->json(['message' => 'Invalid entity type.'], 400);
    }

    $model = $config['model']::find($id);
    if (!$model) {
      return response()->json(['message' => 'Record not found.'], 404);
    }

    if (!$model->custom_image) {
      return response()->json(['message' => 'No custom image to delete.'], 404);
    }

    Storage::disk('public')->delete($model->custom_image);
    $model->custom_image = null;
    $model->save();

    return response()->json([
      'message' => 'Custom image deleted. Rebrickable fallback will be used.',
      'image_url' => $this->getImageUrl($type, $model),
    ]);
  }

  /**
   * Get catalog statistics for admin.
   */
  public function stats(): JsonResponse
  {
    return response()->json([
      'sets' => Set::official()->count(),
      'parts' => Part::count(),
      'minifigs' => Minifig::count(),
      'themes' => Theme::count(),
      'sets_with_custom_image' => Set::whereNotNull('custom_image')->count(),
      'parts_with_custom_image' => Part::whereNotNull('custom_image')->count(),
      'minifigs_with_custom_image' => Minifig::whereNotNull('custom_image')->count(),
      'themes_with_custom_image' => Theme::whereNotNull('custom_image')->count(),
    ]);
  }

  /**
   * Get entity config or null if invalid.
   */
  private function getConfig(string $type): ?array
  {
    return $this->entityConfig[$type] ?? null;
  }

  /**
   * Get image URL for a record, preferring custom image.
   */
  private function getImageUrl(string $type, $model): string
  {
    if ($model->custom_image) {
      return "/storage/{$model->custom_image}";
    }

    return match ($type) {
      'sets' => "https://cdn.rebrickable.com/media/sets/{$model->set_num}.jpg",
      'parts' => "https://cdn.rebrickable.com/media/parts/ldraw/0/{$model->part_num}.png",
      'minifigs' => "https://cdn.rebrickable.com/media/sets/{$model->fig_num}.jpg",
      'themes' => '',
      default => '',
    };
  }
}
