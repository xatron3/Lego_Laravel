<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteSettingController extends Controller
{
  /**
   * Get all site settings.
   */
  public function index(): JsonResponse
  {
    $settings = SiteSetting::all();
    return response()->json($settings);
  }

  /**
   * Get a specific setting by key.
   */
  public function show(string $key): JsonResponse
  {
    $setting = SiteSetting::where('key', $key)->firstOrFail();
    return response()->json($setting);
  }

  /**
   * Update a setting value.
   */
  public function update(Request $request, string $key): JsonResponse
  {
    $validated = $request->validate([
      'content' => 'required',
      'description' => 'nullable|string|max:255',
    ]);

    $setting = SiteSetting::where('key', $key)->firstOrFail();
    $setting->update($validated);
    SiteSetting::clearCache();

    return response()->json($setting);
  }

  /**
   * Create a new setting.
   */
  public function store(Request $request): JsonResponse
  {
    $validated = $request->validate([
      'key' => 'required|string|max:255|unique:site_settings,key',
      'content' => 'required',
      'description' => 'nullable|string|max:255',
    ]);

    $setting = SiteSetting::create($validated);
    SiteSetting::clearCache();

    return response()->json($setting, 201);
  }

  /**
   * Delete a setting.
   */
  public function destroy(string $key): JsonResponse
  {
    $setting = SiteSetting::where('key', $key)->firstOrFail();
    $setting->delete();
    SiteSetting::clearCache();

    return response()->json(['message' => 'Setting deleted.']);
  }
}
