# LEGO LDraw Studio Viewer - AI Agent Instructions

## Project Overview

A Laravel 12 + React 19 SPA for viewing and managing LEGO LDraw model files (.ldr/.mpd). Uses Three.js with LDrawLoader for 3D rendering with step-by-step building instructions.

## Architecture

### Stack

- **Backend**: Laravel 12 (PHP 8.2+), Sanctum for API auth
- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS 4, Three.js via @react-three/fiber
- **Database**: SQLite (default), stores LDraw file content as `longText`

### Key Data Flow

1. User uploads `.ldr`/`.mpd` file → parsed client-side by `parser.ts` into steps
2. `useSceneLoader.ts` uses Three.js `LDrawLoader` to render 3D model from text content
3. Models persist to database via `/api/lego-models` REST API
4. LDraw parts library served statically from `public/ldraw/` (parts/, p/, models/)

### Important Directories

- `resources/js/` - React SPA entry point (`app.tsx`), API client, 3D scene
- `resources/js/hooks/` - Custom hooks: `useModelLoader` (file parsing), `useSceneLoader` (Three.js)
- `app/Http/Controllers/Api/` - REST API controllers
- `public/ldraw/` - LDraw parts library (do not modify, contains license files)

## Developer Commands

```bash
# Full setup (install deps, migrate, build)
composer setup

# Development with all services (server, queue, logs, vite)
composer dev

# Run tests
composer test
```

## Code Patterns

### API Routes & Model Binding

**IMPORTANT**: Do NOT use Laravel's implicit route model binding with `{modelName}` parameters. Use explicit `{id}` parameters instead.

Route definitions in `routes/api.php` use simple ID parameters with manual model loading:

```php
// ✅ Correct: explicit ID parameter
Route::get('lego-models/{id}', [LegoModelController::class, 'show']);

// ❌ Avoid: implicit model binding (unreliable in this project)
Route::get('lego-models/{legoModel}', [LegoModelController::class, 'show']);
```

Controller methods manually load models using `findOrFail()`:

```php
public function show(Request $request, string $id): JsonResponse
{
    $legoModel = LegoModel::findOrFail($id);
    // ... access control checks
}
```

### Model Access Control

The `LegoModel` implements two-tier access control:

- `canBeAccessedBy(?User $user)` - Can user view model details? (Public models = yes)
- `canAccessContent(?User $user)` - Can user access full LDR content? (Requires ownership/purchase for paid models)

Controllers should check access and conditionally hide `ldr_content`:

```php
if (!$legoModel->canAccessContent($request->user())) {
    $model->makeHidden('ldr_content');
}
```

### Inertia.js Performance Pattern (CRITICAL)

**ALWAYS prefer Inertia shared props over API calls** - this is essential for performance and eliminates loading delays/flickering.

#### Share Common Data via Middleware

Global data needed on every page should be shared in `HandleInertiaRequests::share()`:

```php
// app/Http/Middleware/HandleInertiaRequests.php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user()?->only('id', 'name', 'email', 'role', 'avatar'),
        ],
        'cart' => [
            'count' => $request->user()?->cartItems()->sum('quantity') ?? 0,
        ],
    ];
}
```

#### Pass Page-Specific Data via Controllers

Page data should be passed via `Inertia::render()` in controllers, not fetched via API calls in components:

```php
// ✅ Correct: Server-side data hydration
public function index(Request $request)
{
    return Inertia::render('Catalog', [
        'initialStats' => [...],
        'sets' => Set::paginate(24),
    ]);
}

// ❌ Avoid: Client-side API fetching
public function index()
{
    return Inertia::render('Catalog'); // Component makes API call in useEffect
}
```

#### Use Inertia Navigation for Filtering/Updates

Use `router.get()` or `router.reload()` instead of manual API fetches:

```typescript
import { router } from "@inertiajs/react";

// ✅ Correct: Inertia navigation
const handleFilter = (theme: string) => {
    router.get("/catalog", { theme }, { preserveScroll: true });
};

// ❌ Avoid: Manual API calls
const handleFilter = async (theme: string) => {
    const data = await api.getCatalog({ theme });
    setSets(data.sets);
};
```

#### Receive Initial Props in Components

Components receive server data via props, eliminating loading states:

```typescript
interface CatalogProps {
    initialStats: Stats;
    sets: PaginatedResponse<Set>;
}

export default function Catalog({ initialStats, sets }: CatalogProps) {
    // No useEffect, no API calls, instant render with data
    return <div>{sets.data.map(...)}</div>;
}
```

**Benefits**: Eliminates ~1 second delays, removes loading spinners, prevents auth flickering, improves perceived performance.

### Frontend API Calls

Only use the `api` object from `resources/js/api.ts` for actions that modify data (POST/PUT/DELETE):

```typescript
import { api } from "./api";
await api.createModel(formData); // ✅ Mutations only
```

### Three.js/LDraw Integration

- LDrawLoader configured in `useSceneLoader.ts` with paths to `/ldraw/`
- Model text parsed directly via `loader.parse()`, not file loading
- Step visibility controlled via `userData.buildingStep` on each mesh

### React Components

- Single-page app with catch-all route for client-side routing
- Components use Tailwind CSS 4 with dark theme (gray-900 background)
- 3D canvas uses `@react-three/fiber` with `OrbitControls`

## Code Quality & SOLID Principles

### Always Follow SOLID Principles

When writing or modifying code, always adhere to SOLID principles:

1. **Single Responsibility Principle (SRP)**: Each component, function, or class should have one clear purpose
    - Extract large components into smaller, focused ones
    - Separate data fetching, business logic, and UI rendering
    - Example: Detail pages delegate rendering to specialized components (`SetDetail`, `PartDetail`, etc.)

2. **Don't Repeat Yourself (DRY)**: Eliminate code duplication
    - Extract reusable components (e.g., `SetCard`, `LoadingState`, `Pagination`)
    - Create custom hooks for common logic (e.g., `useImageFallback`, `usePagination`)
    - Use utility functions/helpers for repeated operations

3. **Dependency Inversion**: Depend on abstractions, not concrete implementations
    - Components should receive data via props, not make direct API calls when possible
    - Use dependency injection patterns where appropriate

### Code Cleanliness Standards

**Proactive Refactoring**: When you encounter code that could be improved, **always refactor it** unless explicitly told not to. Don't wait for permission.

- **Remove Dead Code**: Delete unused imports, variables, functions, and components immediately
- **Extract Reusable Logic**: If you see the same pattern 2+ times, extract it into a helper/hook/component
- **Simplify Complex Functions**: Break down functions longer than 30 lines into smaller, well-named functions
- **Use Descriptive Names**: Variable and function names should clearly communicate purpose
- **Add Documentation**: Include JSDoc comments for exported functions and complex logic

### File Organization

- **Shared Components**: Place reusable UI components in `resources/js/components/`
- **Feature-Specific Components**: Group related components in subdirectories (e.g., `components/catalog/`)
- **Custom Hooks**: Store in `resources/js/hooks/` with descriptive names starting with `use`
- **Utility Functions**: Create `resources/js/utils/` for pure helper functions
- **Type Definitions**: Keep types close to where they're used, or in `api.ts` for API-related types

### When Reviewing/Modifying Existing Code

1. **Identify Violations**: Look for SRP violations, duplication, unused code
2. **Refactor Proactively**: Fix issues you find, even if they're not part of the current task
3. **Extract and Reuse**: Create shared components/hooks if beneficial
4. **Maintain Consistency**: Follow existing patterns in the codebase (e.g., Tailwind classes, component structure)
5. **Test After Refactoring**: Ensure functionality remains unchanged

### React Components

- Components use Tailwind CSS 4 with dark theme (gray-900 background)
- 3D canvas uses `@react-three/fiber` with `OrbitControls`

## Testing

- PHPUnit for backend (`tests/Feature/`, `tests/Unit/`)
- Run with `composer test` or `php artisan test`

## Known Issues & Workarounds

### Route Model Binding

Laravel's implicit route model binding (e.g., `{legoModel}` parameter auto-resolving to model instance) is **unreliable** in this project. Custom `Route::bind()` configurations in `AppServiceProvider` are not executed consistently.

**Solution**: Always use explicit `{id}` parameters and manually load models with `LegoModel::findOrFail($id)` in controllers.

## Key Files Reference

- [app.tsx](resources/js/app.tsx) - Main React app with model management UI
- [LegoModelController.php](app/Http/Controllers/Api/LegoModelController.php) - CRUD API with manual model loading
- [LegoModel.php](app/Models/LegoModel.php) - Model with `canBeAccessedBy()` and `canAccessContent()` methods
- [useSceneLoader.ts](resources/js/hooks/useSceneLoader.ts) - Three.js LDraw loading
- [parser.ts](resources/js/parser.ts) - LDraw file format step parser
