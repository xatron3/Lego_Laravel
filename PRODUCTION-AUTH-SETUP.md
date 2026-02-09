# Production Authentication Setup

## Critical Environment Variables for Production

When deploying to production with HTTPS, you **MUST** configure these environment variables in your production `.env` file for authentication to work properly:

### 1. Enable Secure Cookies for HTTPS

```env
SESSION_SECURE_COOKIE=true
```

**Why:** Browsers will only send/receive cookies with the `Secure` flag over HTTPS connections. Without this, your session cookies won't be sent, and logout won't work because the cookie-clearing headers will be ignored.

**Symptom if missing:** Logout appears to work, but user is immediately logged back in on page refresh.

### 2. Configure Sanctum Stateful Domains

```env
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
```

**Replace with your actual domain(s).** Use commas to separate multiple domains (with and without www).

**Why:** Sanctum only applies stateful (cookie-based) authentication to domains listed here. If your production domain isn't listed, Sanctum won't apply session middleware, and authentication will fail.

**Examples:**

```env
# Single domain
SANCTUM_STATEFUL_DOMAINS=brickoasis.com

# Multiple domains (with/without www)
SANCTUM_STATEFUL_DOMAINS=brickoasis.com,www.brickoasis.com

# Multiple environments
SANCTUM_STATEFUL_DOMAINS=brickoasis.com,www.brickoasis.com,staging.brickoasis.com
```

### 3. Set Correct Application URL

```env
APP_URL=https://yourdomain.com
```

**Why:** This is used for generating URLs and determining the host for Sanctum.

### 4. Optional: Session Domain (only if needed)

```env
SESSION_DOMAIN=.yourdomain.com
```

**Only set this if:**

- You have subdomains that need to share sessions (e.g., `app.yourdomain.com` and `api.yourdomain.com`)
- Use the leading dot (`.yourdomain.com`) to include all subdomains

**For most setups:** Leave as `null` (default).

## Complete Production .env Template

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Database settings
SESSION_DRIVER=database

# HTTPS Cookie Settings
SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax
SESSION_DOMAIN=null

# Sanctum SPA Authentication
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
```

## Testing Production Authentication

After updating your production `.env`:

1. **Clear config cache:**

    ```bash
    php artisan config:clear
    php artisan config:cache
    ```

2. **Test logout:**
    - Log in to your production site
    - Open browser DevTools → Network tab
    - Click logout
    - Check the logout response headers for `Set-Cookie` with:
        - `Secure` flag
        - Your session cookie name being cleared (Max-Age=0)
    - Refresh the page — you should remain logged out

3. **Clear browser cookies if still having issues:**
    - Sometimes old cookies persist
    - Clear all cookies for your domain
    - Test login/logout fresh

## Debugging Production Issues

If logout still doesn't work:

1. **Check config is cached:**

    ```bash
    php artisan config:cache
    ```

2. **Verify environment variables are loaded:**

    ```bash
    php artisan tinker
    >>> config('session.secure')  // Should be true
    >>> config('sanctum.stateful')  // Should include your domain
    ```

3. **Check browser DevTools:**
    - Network tab → Look at logout request → Response Headers
    - Should see `Set-Cookie` headers clearing session cookies
    - Cookies tab → Verify cookies have `Secure` flag

4. **Common mistakes:**
    - Forgot to run `php artisan config:cache` after changing `.env`
    - Wrong domain in `SANCTUM_STATEFUL_DOMAINS` (no protocol, no trailing slash)
    - Using HTTP instead of HTTPS
    - Load balancer/proxy not forwarding HTTPS properly (check `TrustProxies` middleware)

## What Happens During Logout

1. **Backend** (`AuthController::logout()`):
    - Calls `Auth::guard('web')->logout()` → clears remember token from database
    - Calls `$request->session()->invalidate()` → marks session as invalid
    - Calls `$request->session()->regenerateToken()` → generates new CSRF token
    - Returns JSON response

2. **Middleware** (session/cookie middleware):
    - Intercepts response
    - Adds `Set-Cookie` headers to clear session cookie (Max-Age=0, Expires=past date)
    - Adds `Set-Cookie` headers to clear remember cookie
    - Browser receives response with cookie-clearing headers

3. **Frontend** (`AuthContext.logout()`):
    - Waits for server response
    - Clears local user state
    - Redirects to `/` with full page reload
    - Browser makes new request to `/` WITHOUT old session cookie
    - Server sees no valid session → user is logged out

## Why It Works in Dev But Not Production

Local development usually uses HTTP, so `SESSION_SECURE_COOKIE=false` works fine. Production uses HTTPS, where browsers **require** the `Secure` flag for cookies to be sent/received. Without `SESSION_SECURE_COOKIE=true`, the cookie-clearing headers are sent but browsers ignore them, keeping the old session cookie active.
