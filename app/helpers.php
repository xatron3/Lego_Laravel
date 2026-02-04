<?php

if (!function_exists('seo_slug')) {
    /**
     * Generate a SEO-friendly URL slug from a name and ID.
     * Format: /type/{name-slug-id}
     * Example: millennium-falcon-75192
     *
     * @param string $name The name to slugify
     * @param string|int $id The ID to append
     * @return string The SEO-friendly slug
     */
    function seo_slug(string $name, string|int $id): string
    {
        $slug = \Illuminate\Support\Str::slug($name);
        return "{$slug}-{$id}";
    }
}

if (!function_exists('extract_id_from_slug')) {
    /**
     * Extract the ID from a SEO-friendly slug.
     * Format: name-name-id => id
     *
     * @param string $slug The slug to extract ID from
     * @return string|null The ID or null if not found
     */
    function extract_id_from_slug(string $slug): ?string
    {
        $parts = explode('-', $slug);
        $id = end($parts);

        return is_numeric($id) ? $id : null;
    }
}

if (!function_exists('moc_url')) {
    /**
     * Generate a SEO-friendly URL for a MOC model.
     *
     * @param object|array $model Model object or array with 'name' and 'id'
     * @return string The full URL
     */
    function moc_url(object|array $model): string
    {
        $name = is_array($model) ? $model['name'] : $model->name;
        $id = is_array($model) ? $model['id'] : $model->id;

        return route('moc.show', ['slug' => seo_slug($name, $id)]);
    }
}

if (!function_exists('catalog_set_url')) {
    /**
     * Generate a SEO-friendly URL for a catalog set.
     *
     * @param object|array $set Set object or array with 'name' and 'set_num'
     * @return string The full URL
     */
    function catalog_set_url(object|array $set): string
    {
        $name = is_array($set) ? $set['name'] : $set->name;
        $setNum = is_array($set) ? $set['set_num'] : $set->set_num;

        return route('catalog.set', [
            'setNum' => $setNum,
            'name' => \Illuminate\Support\Str::slug($name)
        ]);
    }
}

if (!function_exists('catalog_part_url')) {
    /**
     * Generate a SEO-friendly URL for a catalog part.
     *
     * @param object|array $part Part object or array with 'name' and 'part_num'
     * @return string The full URL
     */
    function catalog_part_url(object|array $part): string
    {
        $name = is_array($part) ? $part['name'] : $part->name;
        $partNum = is_array($part) ? $part['part_num'] : $part->part_num;

        return route('catalog.part', [
            'partNum' => $partNum,
            'name' => \Illuminate\Support\Str::slug($name)
        ]);
    }
}

if (!function_exists('catalog_minifig_url')) {
    /**
     * Generate a SEO-friendly URL for a catalog minifig.
     *
     * @param object|array $minifig Minifig object or array with 'name' and 'fig_num'
     * @return string The full URL
     */
    function catalog_minifig_url(object|array $minifig): string
    {
        $name = is_array($minifig) ? $minifig['name'] : $minifig->name;
        $figNum = is_array($minifig) ? $minifig['fig_num'] : $minifig->fig_num;

        return route('catalog.minifig', [
            'figNum' => $figNum,
            'name' => \Illuminate\Support\Str::slug($name)
        ]);
    }
}

if (!function_exists('catalog_theme_url')) {
    /**
     * Generate a SEO-friendly URL for a catalog theme.
     *
     * @param object|array $theme Theme object or array with 'name' and 'id'
     * @return string The full URL
     */
    function catalog_theme_url(object|array $theme): string
    {
        $name = is_array($theme) ? $theme['name'] : $theme->name;
        $id = is_array($theme) ? $theme['id'] : $theme->id;

        return route('catalog.theme', [
            'id' => $id,
            'name' => \Illuminate\Support\Str::slug($name)
        ]);
    }
}

if (!function_exists('catalog_color_url')) {
    /**
     * Generate a SEO-friendly URL for a catalog color.
     *
     * @param object|array $color Color object or array with 'name' and 'id'
     * @return string The full URL
     */
    function catalog_color_url(object|array $color): string
    {
        $name = is_array($color) ? $color['name'] : $color->name;
        $id = is_array($color) ? $color['id'] : $color->id;

        return route('catalog.color', [
            'id' => $id,
            'name' => \Illuminate\Support\Str::slug($name)
        ]);
    }
}

if (!function_exists('catalog_category_url')) {
    /**
     * Generate a SEO-friendly URL for a catalog category.
     *
     * @param object|array $category Category object or array with 'name' and 'id'
     * @return string The full URL
     */
    function catalog_category_url(object|array $category): string
    {
        $name = is_array($category) ? $category['name'] : $category->name;
        $id = is_array($category) ? $category['id'] : $category->id;

        return route('catalog.category', [
            'id' => $id,
            'name' => \Illuminate\Support\Str::slug($name)
        ]);
    }
}
