<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SiteSetting extends Model
{
    protected $fillable = ['key', 'content', 'description'];

    protected $casts = [
        'content' => 'json',
    ];

    /**
     * Get a setting value by key with optional default.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        return Cache::remember("site_setting.{$key}", 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();
            return $setting ? $setting->content : $default;
        });
    }

    /**
     * Set a setting value by key.
     */
    public static function setValue(string $key, mixed $value, ?string $description = null): void
    {
        static::updateOrCreate(
            ['key' => $key],
            array_filter([
                'content' => $value,
                'description' => $description,
            ], fn($v) => $v !== null)
        );

        Cache::forget("site_setting.{$key}");
    }

    /**
     * Get all settings as key-value pairs.
     */
    public static function allSettings(): array
    {
        return Cache::remember('site_settings.all', 3600, function () {
            return static::all()->pluck('content', 'key')->toArray();
        });
    }

    /**
     * Clear all settings cache.
     */
    public static function clearCache(): void
    {
        $keys = static::pluck('key');
        foreach ($keys as $key) {
            Cache::forget("site_setting.{$key}");
        }
        Cache::forget('site_settings.all');
    }
}
