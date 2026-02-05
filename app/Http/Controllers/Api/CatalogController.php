<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Color;
use App\Models\Minifig;
use App\Models\Moc;
use App\Models\Part;
use App\Models\PartCategory;
use App\Models\Set;
use App\Models\Theme;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    /**
     * Get catalog statistics.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'sets' => Set::official()->count(),
            'mocs' => Set::mocs()->count(),
            'parts' => Part::count(),
            'minifigs' => Minifig::count(),
            'colors' => Color::count(),
            'themes' => Theme::count(),
        ]);
    }

    /**
     * Browse sets with filtering and pagination.
     */
    public function sets(Request $request): JsonResponse
    {
        $query = Set::query()->official()->with('theme');

        // Search by name or set number
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('set_num', 'like', "%{$search}%");
            });
        }

        // Filter by theme
        if ($themeId = $request->get('theme_id')) {
            // Include child themes
            $themeIds = $this->getThemeWithChildren((int) $themeId);
            $query->whereIn('theme_id', $themeIds);
        }

        // Filter by year range
        if ($yearFrom = $request->get('year_from')) {
            $query->where('year', '>=', (int) $yearFrom);
        }
        if ($yearTo = $request->get('year_to')) {
            $query->where('year', '<=', (int) $yearTo);
        }

        // Filter by min parts
        if ($minParts = $request->get('min_parts')) {
            $query->where('num_parts', '>=', (int) $minParts);
        }

        // Sorting
        $sortBy = $request->get('sort', 'year');
        $sortDir = $request->get('direction', 'desc');

        $allowedSorts = ['name', 'year', 'num_parts', 'set_num'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        }

        $perPage = min($request->get('per_page', 24), 100);

        $result = $query->paginate($perPage);

        // Add image URLs
        $result->getCollection()->transform(function ($set) {
            $set->image_url = $this->getSetImageUrl($set->set_num);
            return $set;
        });

        return response()->json($result);
    }

    /**
     * Get a single set with full details.
     */
    public function showSet(string $setNum): JsonResponse
    {
        $set = Set::with(['theme.parent', 'inventories.parts.part.category', 'inventories.parts.color', 'inventories.minifigs.minifig'])
            ->where('set_num', $setNum)
            ->firstOrFail();

        $set->image_url = $this->getSetImageUrl($set->set_num);
        $set->bricklink_url = $this->getSetBricklinkUrl($set->set_num);

        // Aggregate parts from all inventories (usually just one)
        $partsMap = [];
        $minifigsMap = [];

        foreach ($set->inventories as $inventory) {
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

            foreach ($inventory->minifigs as $invMinifig) {
                $key = $invMinifig->fig_num;
                if (!isset($minifigsMap[$key])) {
                    $minifigsMap[$key] = [
                        'fig_num' => $invMinifig->fig_num,
                        'name' => $invMinifig->minifig?->name ?? 'Unknown',
                        'num_parts' => $invMinifig->minifig?->num_parts ?? 0,
                        'quantity' => 0,
                        'image_url' => $this->getMinifigImageUrl($invMinifig->fig_num),
                        'bricklink_url' => $this->getMinifigBricklinkUrl($invMinifig->fig_num),
                    ];
                }
                $minifigsMap[$key]['quantity'] += $invMinifig->quantity;
            }
        }

        // Sort parts by quantity descending
        $parts = array_values($partsMap);
        usort($parts, fn($a, $b) => $b['quantity'] - $a['quantity']);

        $minifigs = array_values($minifigsMap);

        // Unload inventories to clean up response
        unset($set->inventories);

        $set->parts = $parts;
        $set->parts_count = count($parts);
        $set->total_pieces = array_sum(array_column($parts, 'quantity'));
        $set->minifigs_list = $minifigs;
        $set->minifigs_count = count($minifigs);

        return response()->json($set);
    }

    /**
     * Browse parts with filtering and pagination.
     */
    public function parts(Request $request): JsonResponse
    {
        $query = Part::query()->with('category');

        // Search by name or part number
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('part_num', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if ($categoryId = $request->get('category_id')) {
            $query->where('part_cat_id', (int) $categoryId);
        }

        // Sorting
        $sortBy = $request->get('sort', 'name');
        $sortDir = $request->get('direction', 'asc');

        $allowedSorts = ['name', 'part_num'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        }

        $perPage = min($request->get('per_page', 48), 100);

        $result = $query->paginate($perPage);

        // Add image URLs (use color 0 = black as default)
        $colorId = $request->get('color_id', 0);
        $result->getCollection()->transform(function ($part) use ($colorId) {
            $part->image_url = $this->getPartImageUrl($part->part_num, $colorId);
            // Add element photo as fallback (get first element for this part/color combo)
            $element = $part->elements()->where('color_id', $colorId)->first();
            if (!$element && $colorId != 0) {
                // If no element in requested color, try black
                $element = $part->elements()->where('color_id', 0)->first();
            }
            if (!$element) {
                // If still no element, get any element
                $element = $part->elements()->first();
            }
            $part->photo_url = $element ? $this->getPartPhotoUrl($element->element_id) : null;
            return $part;
        });

        return response()->json($result);
    }

    /**
     * Get a single part with full details.
     */
    public function showPart(string $partNum): JsonResponse
    {
        $part = Part::with(['category', 'elements.color', 'inventoryParts.inventory.set.theme', 'inventoryParts.color'])
            ->where('part_num', $partNum)
            ->firstOrFail();

        $part->image_url = $this->getPartImageUrl($part->part_num, 0);
        // Add photo fallback
        $defaultElement = $part->elements()->where('color_id', 0)->first() ?? $part->elements()->first();
        $part->photo_url = $defaultElement ? $this->getPartPhotoUrl($defaultElement->element_id) : null;
        $part->bricklink_url = $this->getPartBricklinkUrl($part->part_num, 0);

        // Get available colors for this part
        $part->available_colors = $part->elements
            ->pluck('color')
            ->unique('id')
            ->filter()
            ->values()
            ->map(function ($color) use ($part) {
                // Get element ID for this color
                $element = $part->elements()->where('color_id', $color->id)->first();
                return [
                    'id' => $color->id,
                    'name' => $color->name,
                    'rgb' => $color->rgb,
                    'is_trans' => $color->is_trans,
                    'image_url' => $this->getPartImageUrl($part->part_num, $color->id),
                    'photo_url' => $element ? $this->getPartPhotoUrl($element->element_id) : null,
                    'bricklink_url' => $this->getPartBricklinkUrl($part->part_num, $color->id),
                ];
            });

        // Get sets that contain this part (with quantities and colors)
        $setsMap = [];
        foreach ($part->inventoryParts as $invPart) {
            $set = $invPart->inventory?->set;
            if (!$set) continue;

            $key = $set->set_num;
            if (!isset($setsMap[$key])) {
                $setsMap[$key] = [
                    'set_num' => $set->set_num,
                    'name' => $set->name,
                    'year' => $set->year,
                    'theme' => $set->theme?->name,
                    'num_parts' => $set->num_parts,
                    'quantity' => 0,
                    'colors' => [],
                    'image_url' => $this->getSetImageUrl($set->set_num),
                    'bricklink_url' => $this->getSetBricklinkUrl($set->set_num),
                ];
            }
            $setsMap[$key]['quantity'] += $invPart->quantity;
            if ($invPart->color && !in_array($invPart->color->name, $setsMap[$key]['colors'])) {
                $setsMap[$key]['colors'][] = $invPart->color->name;
            }
        }

        // Sort by quantity descending
        $sets = array_values($setsMap);
        usort($sets, fn($a, $b) => $b['quantity'] - $a['quantity']);

        // Limit to 50 sets for performance
        $part->in_sets = array_slice($sets, 0, 50);
        $part->in_sets_count = count($setsMap);

        // Clean up heavy relations
        unset($part->elements);
        unset($part->inventoryParts);

        return response()->json($part);
    }

    /**
     * Browse minifigs with filtering and pagination.
     */
    public function minifigs(Request $request): JsonResponse
    {
        $query = Minifig::query();

        // Search by name or figure number
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('fig_num', 'like', "%{$search}%");
            });
        }

        // Filter by min parts
        if ($minParts = $request->get('min_parts')) {
            $query->where('num_parts', '>=', (int) $minParts);
        }

        // Sorting
        $sortBy = $request->get('sort', 'name');
        $sortDir = $request->get('direction', 'asc');

        $allowedSorts = ['name', 'fig_num', 'num_parts'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        }

        $perPage = min($request->get('per_page', 48), 100);

        $result = $query->paginate($perPage);

        // Add image URLs
        $result->getCollection()->transform(function ($minifig) {
            $minifig->image_url = $this->getMinifigImageUrl($minifig->fig_num);
            return $minifig;
        });

        return response()->json($result);
    }

    /**
     * Get a single minifig with full details.
     */
    public function showMinifig(string $figNum): JsonResponse
    {
        $minifig = Minifig::with(['inventoryMinifigs.inventory.set.theme'])
            ->where('fig_num', $figNum)
            ->firstOrFail();

        $minifig->image_url = $this->getMinifigImageUrl($minifig->fig_num);
        $minifig->bricklink_url = $this->getMinifigBricklinkUrl($minifig->fig_num);

        // Get sets that contain this minifig
        $setsMap = [];
        foreach ($minifig->inventoryMinifigs as $invMinifig) {
            $set = $invMinifig->inventory?->set;
            if (!$set) continue;

            $key = $set->set_num;
            if (!isset($setsMap[$key])) {
                $setsMap[$key] = [
                    'set_num' => $set->set_num,
                    'name' => $set->name,
                    'year' => $set->year,
                    'theme' => $set->theme?->name,
                    'num_parts' => $set->num_parts,
                    'quantity' => 0,
                    'image_url' => $this->getSetImageUrl($set->set_num),
                    'bricklink_url' => $this->getSetBricklinkUrl($set->set_num),
                ];
            }
            $setsMap[$key]['quantity'] += $invMinifig->quantity;
        }

        // Sort by year descending
        $sets = array_values($setsMap);
        usort($sets, fn($a, $b) => $b['year'] - $a['year']);

        $minifig->in_sets = $sets;
        $minifig->in_sets_count = count($sets);

        // Clean up
        unset($minifig->inventoryMinifigs);

        return response()->json($minifig);
    }

    /**
     * Get all colors.
     */
    public function colors(Request $request): JsonResponse
    {
        $query = Color::query();

        // Search by name
        if ($search = $request->get('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        // Filter by transparency
        if ($request->has('is_trans')) {
            $query->where('is_trans', $request->boolean('is_trans'));
        }

        // Sorting
        $sortBy = $request->get('sort', 'name');
        $sortDir = $request->get('direction', 'asc');

        $allowedSorts = ['name', 'id'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        }

        // Return all colors (no pagination needed, usually < 300)
        $colors = $query->get();

        return response()->json($colors);
    }

    /**
     * Get a single color with parts that come in this color.
     */
    public function showColor(int $colorId): JsonResponse
    {
        $color = Color::with(['inventoryParts.part.category'])
            ->findOrFail($colorId);

        // Get unique parts that come in this color
        $partsMap = [];
        foreach ($color->inventoryParts as $invPart) {
            $part = $invPart->part;
            if (!$part) continue;

            $key = $part->part_num;
            if (!isset($partsMap[$key])) {
                // Get element for this part+color combination
                $element = $part->elements()->where('color_id', $colorId)->first();
                $partsMap[$key] = [
                    'part_num' => $part->part_num,
                    'name' => $part->name,
                    'category' => $part->category?->name ?? 'Unknown',
                    'image_url' => $this->getPartImageUrl($part->part_num, $colorId),
                    'photo_url' => $element ? $this->getPartPhotoUrl($element->element_id) : null,
                    'bricklink_url' => $this->getPartBricklinkUrl($part->part_num, $colorId),
                ];
            }
        }

        $parts = array_values($partsMap);
        // Limit to 100 parts for performance
        $color->parts = array_slice($parts, 0, 100);
        $color->parts_count = count($partsMap);

        // Clean up
        unset($color->inventoryParts);

        return response()->json($color);
    }

    /**
     * Get all themes in hierarchical structure.
     */
    public function themes(Request $request): JsonResponse
    {
        $query = Theme::query();

        // Search by name
        if ($search = $request->get('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        // Get root themes with children
        if ($request->boolean('hierarchical', true)) {
            $themes = Theme::whereNull('parent_id')
                ->with('children.children')
                ->withCount('sets')
                ->orderBy('name')
                ->get();

            return response()->json($themes);
        }

        // Flat list
        $themes = $query->withCount('sets')->orderBy('name')->get();

        return response()->json($themes);
    }

    /**
     * Get a single theme with its sets and subthemes.
     */
    public function showTheme(int $themeId): JsonResponse
    {
        $theme = Theme::with(['parent', 'children.children'])
            ->withCount('sets')
            ->findOrFail($themeId);

        // Get sets in this theme (paginated to first 50)
        $sets = Set::where('theme_id', $themeId)
            ->orderBy('year', 'desc')
            ->orderBy('name')
            ->limit(50)
            ->get()
            ->map(function ($set) {
                return [
                    'set_num' => $set->set_num,
                    'name' => $set->name,
                    'year' => $set->year,
                    'num_parts' => $set->num_parts,
                    'image_url' => $this->getSetImageUrl($set->set_num),
                    'bricklink_url' => $this->getSetBricklinkUrl($set->set_num),
                ];
            });

        $theme->sets_list = $sets;

        // Add counts for children
        if ($theme->children) {
            $theme->children->each(function ($child) {
                $child->sets_count = Set::where('theme_id', $child->id)->count();
            });
        }

        return response()->json($theme);
    }

    /**
     * Get a single category with its parts.
     */
    public function showCategory(int $categoryId): JsonResponse
    {
        $category = PartCategory::withCount('parts')
            ->findOrFail($categoryId);

        // Get parts in this category (paginated to first 100)
        $parts = Part::where('part_cat_id', $categoryId)
            ->orderBy('name')
            ->limit(100)
            ->get()
            ->with('elements')
            ->get()
            ->map(function ($part) {
                $element = $part->elements()->where('color_id', 0)->first() ?? $part->elements()->first();
                return [
                    'part_num' => $part->part_num,
                    'name' => $part->name,
                    'image_url' => $this->getPartImageUrl($part->part_num, 0),
                    'photo_url' => $element ? $this->getPartPhotoUrl($element->element_id) : null,
                    'bricklink_url' => $this->getPartBricklinkUrl($part->part_num, 0),
                ];
            });

        $category->parts_list = $parts;

        return response()->json($category);
    }

    /**
     * Get all part categories.
     */
    public function categories(Request $request): JsonResponse
    {
        $categories = PartCategory::withCount('parts')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    /**
     * Get year range for sets.
     */
    public function yearRange(): JsonResponse
    {
        $min = Set::min('year') ?? 1950;
        $max = Set::max('year') ?? date('Y');

        return response()->json([
            'min' => $min,
            'max' => $max,
        ]);
    }

    // ==================== Helper Methods ====================

    /**
     * Get theme IDs including all children.
     */
    private function getThemeWithChildren(int $themeId): array
    {
        $ids = [$themeId];
        $children = Theme::where('parent_id', $themeId)->pluck('id')->toArray();

        foreach ($children as $childId) {
            $ids = array_merge($ids, $this->getThemeWithChildren($childId));
        }

        return $ids;
    }

    /**
     * Get Rebrickable image URL for a set.
     */
    private function getSetImageUrl(string $setNum): string
    {
        return "https://cdn.rebrickable.com/media/sets/{$setNum}.jpg";
    }

    /**
     * Get Rebrickable image URL for a part.
     * Returns primary URL (LDraw render). Frontend should fallback to element photos if this fails.
     */
    private function getPartImageUrl(string $partNum, int $colorId): string
    {
        // Primary: LDraw renders (not all parts have these)
        return "https://cdn.rebrickable.com/media/parts/ldraw/{$colorId}/{$partNum}.png";
    }

    /**
     * Get Rebrickable photo URL for a part (uses element ID).
     */
    private function getPartPhotoUrl(?string $elementId): ?string
    {
        if (!$elementId) return null;
        return "https://cdn.rebrickable.com/media/parts/elements/{$elementId}.jpg";
    }

    /**
     * Get Rebrickable image URL for a minifig.
     */
    private function getMinifigImageUrl(string $figNum): string
    {
        return "https://cdn.rebrickable.com/media/sets/{$figNum}.jpg";
    }

  // ==================== BrickLink URL Helpers ====================

    /**
     * Get BrickLink URL for a set.
     */
    private function getSetBricklinkUrl(string $setNum): string
    {
        return "https://www.bricklink.com/v2/catalog/catalogitem.page?S={$setNum}";
    }

    /**
     * Get BrickLink URL for a part.
     */
    private function getPartBricklinkUrl(string $partNum, int $colorId): string
    {
        // BrickLink part page, color can be selected there
        return "https://www.bricklink.com/v2/catalog/catalogitem.page?P={$partNum}";
    }

    /**
     * Get BrickLink URL for a minifig.
     */
    private function getMinifigBricklinkUrl(string $figNum): string
    {
        return "https://www.bricklink.com/v2/catalog/catalogitem.page?M={$figNum}";
    }

    // ==================== MOC Methods ====================

    /**
     * Browse MOCs with filtering and pagination.
     */
    public function mocs(Request $request): JsonResponse
    {
        $query = Set::query()
            ->mocs()
            ->with(['theme', 'moc.user:id,name', 'moc.images']);

        // Search by name or set number
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('set_num', 'like', "%{$search}%");
            });
        }

        // Filter by theme
        if ($themeId = $request->get('theme_id')) {
            $themeIds = $this->getThemeWithChildren((int) $themeId);
            $query->whereIn('theme_id', $themeIds);
        }

        // Filter by year
        if ($year = $request->get('year')) {
            $query->where('year', (int) $year);
        }

        // Filter by min parts
        if ($minParts = $request->get('min_parts')) {
            $query->where('num_parts', '>=', (int) $minParts);
        }

        // Sorting
        $sortBy = $request->get('sort', 'year');
        $sortDir = $request->get('direction', 'desc');

        $allowedSorts = ['name', 'num_parts', 'set_num', 'year'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        }

        $perPage = min($request->get('per_page', 24), 100);

        $result = $query->paginate($perPage);

        // Add display thumbnail from MOC images (primary image)
        $result->getCollection()->transform(function ($set) {
            if ($set->moc) {
                $set->image_url = $set->moc->thumbnail;
            } else {
                $set->image_url = $this->getSetImageUrl($set->set_num);
            }
            return $set;
        });

        return response()->json($result);
    }

    /**
     * Get a single MOC with full details.
     */
    public function showMoc(Request $request, string $setNum): JsonResponse
    {
        $moc = Moc::with([
            'set.theme.parent',
            'set.inventories.parts.part.category',
            'set.inventories.parts.color',
            'set.inventories.minifigs.minifig',
            'user:id,name',
            'images'
        ])
            ->where('set_num', $setNum)
            ->firstOrFail();

        // Check if user can access this MOC
        if (!$moc->canBeAccessedBy($request->user())) {
            abort(403, 'You do not have permission to view this MOC.');
        }

        // Hide LDR content if user doesn't have access
        if (!$moc->canAccessContent($request->user())) {
            $moc->makeHidden('ldr_content');
        }

        $moc->bricklink_url = $this->getSetBricklinkUrl($moc->set_num);

        // Aggregate parts from the set's inventories
        $partsMap = [];
        $minifigsMap = [];

        if ($moc->set) {
            foreach ($moc->set->inventories as $inventory) {
                foreach ($inventory->parts as $invPart) {
                    $key = $invPart->part_num . '_' . $invPart->color_id;
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
                            'image_url' => $this->getPartImageUrl($invPart->part_num, $invPart->color_id),
                            'photo_url' => $element ? $this->getPartPhotoUrl($element->element_id) : null,
                            'bricklink_url' => $this->getPartBricklinkUrl($invPart->part_num, $invPart->color_id),
                        ];
                    }
                    $partsMap[$key]['quantity'] += $invPart->quantity;
                }

                foreach ($inventory->minifigs as $invMinifig) {
                    $key = $invMinifig->fig_num;
                    if (!isset($minifigsMap[$key])) {
                        $minifigsMap[$key] = [
                            'fig_num' => $invMinifig->fig_num,
                            'name' => $invMinifig->minifig?->name ?? 'Unknown',
                            'num_parts' => $invMinifig->minifig?->num_parts ?? 0,
                            'quantity' => 0,
                            'image_url' => $this->getMinifigImageUrl($invMinifig->fig_num),
                            'bricklink_url' => $this->getMinifigBricklinkUrl($invMinifig->fig_num),
                        ];
                    }
                    $minifigsMap[$key]['quantity'] += $invMinifig->quantity;
                }
            }
        }

        // Sort parts by quantity descending
        $parts = array_values($partsMap);
        usort($parts, fn($a, $b) => $b['quantity'] - $a['quantity']);

        $minifigs = array_values($minifigsMap);

        // Unload the set.inventories to clean up response
        if ($moc->set) {
            unset($moc->set->inventories);
        }

        $moc->parts = $parts;
        $moc->parts_count = count($parts);
        $moc->total_pieces = array_sum(array_column($parts, 'quantity'));
        $moc->minifigs_list = $minifigs;
        $moc->minifigs_count = count($minifigs);

        return response()->json($moc);
    }
}
