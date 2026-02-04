# SEO-Optimized Routes Guide

This document describes the SEO-friendly URL structure implemented for better search engine visibility and user experience.

## Route Organization

Routes are now organized into separate files for better maintainability:

- **`routes/web.php`** - Public web pages and SPA routes
- **`routes/api.php`** - Core API routes for models, cart, checkout, etc.
- **`routes/auth.php`** - Authentication routes (OAuth, login, register)
- **`routes/admin.php`** - Admin and moderator routes
- **`routes/catalog.php`** - Catalog browsing routes (Rebrickable data)
- **`routes/ldraw.php`** - LDraw file serving routes

All route files are automatically loaded via `bootstrap/app.php`.

## SEO-Friendly URL Patterns

### MOC Models

**Old:** `/model/123`  
**New:** `/mocs/{slug}` where slug format is `name-name-id`

**Examples:**

- `/mocs/millennium-falcon-75192`
- `/mocs/custom-castle-12345`
- `/mocs/tie-fighter-789`

The ID is extracted from the last segment of the slug, allowing the name portion to be flexible for SEO while maintaining unique identification.

### Catalog Sets

**Old:** `/catalog/set/75192`  
**New:** `/catalog/sets/{setNum}/{name?}`

**Examples:**

- `/catalog/sets/75192/millennium-falcon`
- `/catalog/sets/10179/ultimate-collectors-millennium-falcon`

The `{name}` parameter is optional but recommended for SEO. The `setNum` is the primary identifier.

### Catalog Parts

**Old:** `/catalog/part/3001`  
**New:** `/catalog/parts/{partNum}/{name?}`

**Examples:**

- `/catalog/parts/3001/brick-2x4`
- `/catalog/parts/3622/brick-1x3`

### Catalog Minifigs

**Old:** `/catalog/minifig/sw0001`  
**New:** `/catalog/minifigs/{figNum}/{name?}`

**Examples:**

- `/catalog/minifigs/sw0001/obi-wan-kenobi`
- `/catalog/minifigs/hp001/harry-potter`

### Catalog Themes

**Old:** `/catalog/theme/158`  
**New:** `/catalog/themes/{id}/{name?}`

**Examples:**

- `/catalog/themes/158/star-wars`
- `/catalog/themes/246/harry-potter`

### Catalog Colors

**Old:** `/catalog/color/0`  
**New:** `/catalog/colors/{id}/{name?}`

**Examples:**

- `/catalog/colors/0/black`
- `/catalog/colors/15/white`

### Catalog Categories

**Old:** `/catalog/category/3`  
**New:** `/catalog/categories/{id}/{name?}`

**Examples:**

- `/catalog/categories/3/bricks`
- `/catalog/categories/11/plates`

## URL Helper Functions

Helper functions are available in `app/helpers.php` to generate SEO-friendly URLs:

### `seo_slug($name, $id)`

Generate a SEO-friendly slug from name and ID.

```php
seo_slug('Millennium Falcon', '75192') // returns: millennium-falcon-75192
```

### `extract_id_from_slug($slug)`

Extract ID from a SEO-friendly slug.

```php
extract_id_from_slug('millennium-falcon-75192') // returns: '75192'
```

### URL Generators

Use these functions in your views and controllers:

```php
// MOC models
moc_url($model) // /mocs/millennium-falcon-75192

// Catalog items
catalog_set_url($set)           // /catalog/sets/75192/millennium-falcon
catalog_part_url($part)         // /catalog/parts/3001/brick-2x4
catalog_minifig_url($minifig)   // /catalog/minifigs/sw0001/obi-wan-kenobi
catalog_theme_url($theme)       // /catalog/themes/158/star-wars
catalog_color_url($color)       // /catalog/colors/0/black
catalog_category_url($category) // /catalog/categories/3/bricks
```

## Benefits

1. **SEO Improvement**: Descriptive URLs with keywords help search engines understand content
2. **User Experience**: URLs are readable and shareable
3. **Social Media**: URLs display meaningful information in previews
4. **Analytics**: Easier to track specific content performance
5. **Flexibility**: Name portion can change without breaking links (ID is the key)

## Migration Notes

### Frontend Updates Needed

When using these URLs in your React components, use the helper functions or construct URLs manually:

```typescript
// Example: Generating a MOC URL
const mocUrl = `/mocs/${model.name.toLowerCase().replace(/\s+/g, "-")}-${model.id}`;

// Example: Parsing a slug
const slug = "millennium-falcon-75192";
const id = slug.split("-").pop(); // '75192'
```

### Link Updates

Update all frontend links to use the new URL structure:

```jsx
// Old
<Link href={`/model/${model.id}`}>View Model</Link>

// New
<Link href={`/mocs/${slugify(model.name)}-${model.id}`}>View Model</Link>

// Or use route helper
<Link href={route('moc.show', { slug: seo_slug(model.name, model.id) })}>
  View Model
</Link>
```

## Route Middleware

- **Admin routes**: Require `auth:sanctum` and `role:admin` middleware
- **Moderator routes**: Require `auth:sanctum` and `role:mod` middleware
- **Authenticated routes**: Require `auth:sanctum` middleware
- **Public routes**: No authentication required

## Testing Routes

View all routes:

```bash
php artisan route:list
```

Filter by path:

```bash
php artisan route:list --path=catalog
php artisan route:list --path=admin
php artisan route:list --path=mocs
```

Clear route cache:

```bash
php artisan route:clear
```
