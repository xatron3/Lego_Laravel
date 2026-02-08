# Authentication & Session Management Fixes

## Issues Fixed

### 1. **Remember Me Cookie Not Cleared on Logout** ✅ (February 2026 - Critical Fix)

**Problem**: The logout flow wasn't clearing the "remember me" cookie, causing users to be immediately re-authenticated after logout.

**Symptoms**:

- Logout API returns success (`{"message":"Logged out successfully"}`)
- User is immediately re-authenticated when page reloads
- Inertia props still show authenticated user after logout
- Session appears to persist despite logout

**Root Cause**:

When users log in via Google OAuth, the code uses `Auth::login($user, true)` where `true` sets a persistent "remember me" cookie. The logout method was calling `Auth::guard('web')->logout()` which should clear this cookie, but with Sanctum's stateful API configuration and Inertia navigation, the cookie wasn't being cleared properly:

```php
// INCOMPLETE LOGOUT
Auth::guard('web')->logout();
$request->session()->invalidate();
// ❌ Remember cookie still exists, re-authenticates user
```

Additionally, the frontend was using Inertia navigation which might not process Set-Cookie headers before the next request:

```typescript
// PROBLEMATIC
router.visit("/"); // ❌ Might not wait for cookies to clear
```

**Fix**:

**Backend** - Explicitly clear remember token from database AND send expired cookie:

```php
// Clear remember token from database
if ($user = $request->user()) {
    $user->setRememberToken(null);
    $user->save();
}

Auth::guard('web')->logout();
$request->session()->invalidate();
$request->session()->regenerateToken();

// Explicitly expire the remember cookie
$cookieName = 'remember_web_' . sha1(\Illuminate\Auth\SessionGuard::class);
$cookie = cookie(
    $cookieName,
    null,
    -2628000, // Expire immediately
    config('session.path'),
    config('session.domain'),
    config('session.secure'),
    true // httpOnly
);

return response()
    ->json(['message' => 'Logged out successfully'])
    ->withCookie($cookie);
```

**Frontend** - Use full page reload to ensure cookies are processed:

```typescript
// Wait for logout to complete
const response = await fetch("/api/auth/logout", {
    /* ... */
});
await response.json(); // Ensure Set-Cookie headers are received

setUser(null);

// Full page reload ensures browser processes cookie clearing
window.location.href = "/"; // ✅ Reliable cookie clearing
```

**Files Changed**:

- `app/Http/Controllers/Api/AuthController.php` - Added explicit remember cookie clearing
- `resources/js/contexts/AuthContext.tsx` - Changed to full page reload on logout

### 2. **Logout Race Condition & Unnecessary Reload** ✅ (February 2026)

**Problem**: The logout flow had a race condition where navigation happened before the server session was fully invalidated, and an unnecessary `router.reload()` call was triggering a second request that could re-authenticate the user.

**Symptoms**:

- User clicks logout but remains logged in
- Logout appears to work but user is re-authenticated immediately
- Inconsistent logout behavior

**Root Cause**:

```typescript
// OLD CODE - PROBLEMATIC
finally {
    setUser(null);
    router.visit("/", {
        onSuccess: () => {
            router.reload({ only: ['auth'] }); // ❌ Unnecessary second request
        }
    });
}
```

The `finally` block executed immediately, causing:

1. `router.visit("/")` to start before the logout API completed
2. The homepage request might fetch the old session (before invalidation)
3. The `router.reload()` in `onSuccess` triggered a SECOND unnecessary request
4. This created a race condition causing intermittent re-authentication

**Fix**: Moved navigation inside the `try` block to wait for logout completion, and removed the unnecessary reload:

```typescript
// NEW CODE - FIXED
try {
    await fetch("/api/auth/logout", {
        /* ... */
    });
    setUser(null);
    router.visit("/", { replace: true }); // ✅ Single navigation after logout
} catch (error) {
    // Still logout client-side even if server fails
    setUser(null);
    router.visit("/", { replace: true });
}
```

**Files Changed**:

- `resources/js/contexts/AuthContext.tsx`

### 3. **Primary Issue: Missing Inertia Reload After Login/Register** ✅

**Problem**: After successful API login/register, the frontend updated local React state but didn't reload Inertia's shared props. This caused a disconnect between the client-side auth state and the server session state.

**Symptoms**:

- User appears logged in but gets logged out after page refresh
- Inconsistent login persistence (works sometimes, fails other times)
- More reliable on dashboard pages (which trigger navigations) than static pages

**Fix**: Added `router.reload({ only: ['auth', 'cart', 'notifications'] })` after successful login/register in `AuthContext.tsx`. This ensures Inertia's shared props are synchronized with the server session immediately.

**Files Changed**:

- `resources/js/contexts/AuthContext.tsx`

### 4. **Google OAuth Missing Session Regeneration** ✅

**Problem**: The Google OAuth callback controller didn't regenerate the session after login, which is both a security issue (session fixation vulnerability) and can cause session persistence problems.

**Fix**: Added `request()->session()->regenerate()` after `Auth::login()` in the Google OAuth callback.

**Files Changed**:

- `app/Http/Controllers/Auth/GoogleController.php`

### 5. **Duplicate Middleware Stack** ✅

**Problem**: The auth routes in `routes/auth.php` manually applied middleware that was already being applied globally to all API routes in `bootstrap/app.php`. This could cause middleware to execute twice and interfere with session handling.

**Fix**: Removed the duplicate middleware application from auth routes since it's already handled globally.

**Files Changed**:

- `routes/auth.php`

### 6. **Sanctum Stateful Domains Configuration** ✅

**Problem**: The sprintf format string had `%s%s` instead of `%s,%s`, which would concatenate domains without a separator, potentially breaking Sanctum's stateful domain matching.

**Fix**: Changed sprintf format to properly comma-separate the domains.

**Files Changed**:

- `config/sanctum.php`

### 7. **Missing Production Session Configuration** ✅

**Problem**: The `.env.example` was missing critical session configuration variables needed for production deployments, particularly `SESSION_SECURE_COOKIE`, `SESSION_HTTP_ONLY`, and `SESSION_SAME_SITE`.

**Fix**: Added missing environment variables with appropriate defaults.

**Files Changed**:

- `.env.example`
- `config/session.php` (added default value for SESSION_SECURE_COOKIE)

## Production Deployment Checklist

When deploying to production, ensure your `.env` file has these settings:

```env
# App
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Session Configuration (CRITICAL for auth to work properly)
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null  # Or .yourdomain.com for subdomain support
SESSION_SECURE_COOKIE=true  # MUST be true for HTTPS
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax  # or 'strict' for extra security

# Sanctum Configuration
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
```

### Common Production Issues

#### Issue: Session not persisting across requests

**Cause**: `SESSION_SECURE_COOKIE` not set to `true` on HTTPS sites
**Fix**: Set `SESSION_SECURE_COOKIE=true` in production `.env`

#### Issue: CSRF token mismatch

**Cause**: Session domain configuration incorrect
**Fix**: Ensure `SESSION_DOMAIN` matches your domain (use `null` for single domain, `.yourdomain.com` for subdomains)

#### Issue: Login works but user logged out on next page

**Cause**: Sanctum stateful domains not configured correctly
**Fix**: Set `SANCTUM_STATEFUL_DOMAINS` to include your production domain(s)

#### Issue: Different behavior between dashboard and other pages

**Cause**: Inertia shared props not being reloaded after login (NOW FIXED)
**Fix**: Already implemented in this update - `router.reload()` is now called after login/register

## Testing the Fixes

### Local Testing

#### Login Testing

1. Clear your browser cookies and cache
2. Test login from:
    - Homepage
    - Store page
    - Dashboard page
    - Any static page (About, Privacy, etc.)
3. After login, verify you stay logged in when:
    - Navigating to different pages
    - Refreshing the page
    - Opening the site in a new tab

#### Logout Testing

1. Log in to the application
2. Navigate to different pages to confirm you're logged in
3. Click the logout button
4. Verify that:
    - You are redirected to the homepage
    - User menu shows "Sign In" instead of your profile
    - Refreshing the page keeps you logged out
    - Opening a new tab shows you as logged out
    - Trying to access protected routes redirects you to login
5. Test logout from different pages (Dashboard, Catalog, etc.)

### Production Testing

1. Deploy the changes to production
2. Verify `.env` has all the production settings listed above
3. Clear application cache: `php artisan config:cache`
4. Clear sessions: `php artisan session:clear` (if available) or truncate the sessions table
5. Test the same flow as local testing
6. Monitor Laravel logs for any session-related errors

## How Authentication Flow Works Now

### Email/Password Login Flow

1. User submits login form in `AuthModal`
2. `AuthContext.login()` is called:
    - Fetches CSRF cookie from `/sanctum/csrf-cookie`
    - POSTs credentials to `/api/auth/login`
    - Backend (`AuthController.login()`):
        - Validates credentials
        - Calls `Auth::attempt()` which creates session
        - Calls `$request->session()->regenerate()` for security
        - Returns user data
    - Frontend updates local state with `setUser(userData)`
    - **NEW**: Calls `router.reload({ only: ['auth', 'cart', 'notifications'] })`
        - This triggers Inertia to reload shared props from server
        - `HandleInertiaRequests::share()` runs and gets authenticated user
        - Client and server state are now synchronized
3. User is now logged in consistently across all pages

### Google OAuth Login Flow

1. User clicks "Continue with Google" button
2. Redirected to `/auth/google` → Google OAuth consent screen
3. Google redirects back to `/auth/google/callback`
4. `GoogleController.callback()`:
    - Gets user data from Google
    - Finds or creates user in database
    - Calls `Auth::login($user, true)` to create session
    - **NEW**: Calls `request()->session()->regenerate()` for security
    - Redirects to homepage
5. Inertia loads homepage with authenticated user in shared props
6. `AuthProvider` receives `initialUser` from Inertia props
7. User is logged in

### Logout Flow

1. User clicks logout button in `UserMenu`
2. `AuthContext.logout()` is called:
    - **Awaits** the POST request to `/api/auth/logout` to complete
    - Backend (`AuthController.logout()`):
        - Calls `Auth::guard('web')->logout()` to clear authentication
        - Calls `$request->session()->invalidate()` to destroy session
        - Calls `$request->session()->regenerateToken()` to regenerate CSRF token
        - Returns success response
    - After successful logout, frontend clears local state with `setUser(null)`
    - Calls `router.visit("/", { replace: true })` to navigate to homepage
        - This fetches fresh Inertia props from server
        - `HandleInertiaRequests::share()` returns `null` for user (no session)
        - Client receives guest state
3. User is now logged out consistently

**Key Fix**: The logout now **awaits** the server response before navigating, ensuring the session is invalidated before the homepage is loaded. The previous implementation used a `finally` block that executed immediately, causing a race condition where the homepage could be requested before the session was fully cleared.

### Why This Fix Works

**Before**: After API login, user data was stored in React state but Inertia didn't know about it. On the next page navigation, Inertia would fetch fresh props from the server, which correctly showed the user as authenticated. However, if no navigation occurred, or if there were timing issues, the client and server state could be out of sync.

**After**: Immediately after login, we force Inertia to reload its shared props. This ensures:

1. Server session is created and persisted ✅
2. Inertia knows about the authentication state ✅
3. Client state matches server state ✅
4. All subsequent requests include proper session cookies ✅

## Additional Notes

- The session is stored in the database (`SESSION_DRIVER=database`), which is more reliable than file-based sessions in multi-server deployments
- Session lifetime is 120 minutes by default
- "Remember me" functionality is handled by Laravel's built-in persistent login feature
- All session cookies are HTTP-only by default to prevent XSS attacks
- CSRF protection is handled automatically by Sanctum's `EnsureFrontendRequestsAreStateful` middleware

## Rollback Plan

If you experience issues after deploying these changes:

1. The critical change is in `AuthContext.tsx` - the `router.reload()` calls
2. If needed, you can temporarily remove those lines, but this will bring back the original issue
3. Instead, check your production `.env` configuration first - most issues are configuration-related
