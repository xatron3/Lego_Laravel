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

### API Routes

Use Laravel resource controllers with `apiResource()` in `routes/api.php`:

```php
Route::apiResource('lego-models', LegoModelController::class);
```

### Frontend API Calls

Use the `api` object from `resources/js/api.ts` - includes CSRF token handling:

```typescript
import { api } from "./api";
const models = await api.getModels();
```

### Three.js/LDraw Integration

- LDrawLoader configured in `useSceneLoader.ts` with paths to `/ldraw/`
- Model text parsed directly via `loader.parse()`, not file loading
- Step visibility controlled via `userData.buildingStep` on each mesh

### React Components

- Single-page app with catch-all route for client-side routing
- Components use Tailwind CSS 4 with dark theme (gray-900 background)
- 3D canvas uses `@react-three/fiber` with `OrbitControls`

## Testing

- PHPUnit for backend (`tests/Feature/`, `tests/Unit/`)
- Run with `composer test` or `php artisan test`

## Key Files Reference

- [app.tsx](resources/js/app.tsx) - Main React app with model management UI
- [LegoModelController.php](app/Http/Controllers/Api/LegoModelController.php) - CRUD API
- [useSceneLoader.ts](resources/js/hooks/useSceneLoader.ts) - Three.js LDraw loading
- [parser.ts](resources/js/parser.ts) - LDraw file format step parser
