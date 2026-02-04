/**
 * SEO-friendly URL utility functions
 *
 * These functions generate SEO-optimized URLs for models, catalog items, etc.
 * matching the backend route structure defined in routes/*.php
 */

/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/[^\w\-]+/g, "") // Remove all non-word chars
        .replace(/\-\-+/g, "-") // Replace multiple - with single -
        .replace(/^-+/, "") // Trim - from start of text
        .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Generate a SEO-friendly slug with ID
 * Format: name-name-id
 */
export function seoSlug(name: string, id: string | number): string {
    const slug = slugify(name);
    return `${slug}-${id}`;
}

/**
 * Extract ID from a SEO-friendly slug
 * Format: name-name-id => id
 */
export function extractIdFromSlug(slug: string): string | null {
    const parts = slug.split("-");
    const id = parts[parts.length - 1];
    return /^\d+$/.test(id) ? id : null;
}

/**
 * Generate a SEO-friendly URL for a MOC model
 * Format: /mocs/{slug}-{id}
 */
export function mocUrl(model: { name: string; id: string | number }): string {
    return `/mocs/${seoSlug(model.name, model.id)}`;
}

/**
 * Generate a SEO-friendly URL for a catalog set
 * Format: /catalog/sets/{setNum}/{name}
 */
export function catalogSetUrl(set: { name: string; set_num: string }): string {
    return `/catalog/sets/${set.set_num}/${slugify(set.name)}`;
}

/**
 * Generate a SEO-friendly URL for a catalog part
 * Format: /catalog/parts/{partNum}/{name}
 */
export function catalogPartUrl(part: {
    name: string;
    part_num: string;
}): string {
    return `/catalog/parts/${part.part_num}/${slugify(part.name)}`;
}

/**
 * Generate a SEO-friendly URL for a catalog minifig
 * Format: /catalog/minifigs/{figNum}/{name}
 */
export function catalogMinifigUrl(minifig: {
    name: string;
    fig_num: string;
}): string {
    return `/catalog/minifigs/${minifig.fig_num}/${slugify(minifig.name)}`;
}

/**
 * Generate a SEO-friendly URL for a catalog theme
 * Format: /catalog/themes/{id}/{name}
 */
export function catalogThemeUrl(theme: {
    name: string;
    id: string | number;
}): string {
    return `/catalog/themes/${theme.id}/${slugify(theme.name)}`;
}

/**
 * Generate a SEO-friendly URL for a catalog color
 * Format: /catalog/colors/{id}/{name}
 */
export function catalogColorUrl(color: {
    name: string;
    id: string | number;
}): string {
    return `/catalog/colors/${color.id}/${slugify(color.name)}`;
}

/**
 * Generate a SEO-friendly URL for a catalog category
 * Format: /catalog/categories/{id}/{name}
 */
export function catalogCategoryUrl(category: {
    name: string;
    id: string | number;
}): string {
    return `/catalog/categories/${category.id}/${slugify(category.name)}`;
}
