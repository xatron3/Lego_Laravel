# Queue Worker Guide

## The Problem

The default `php artisan queue:work` command has a 60-second timeout, causing long-running import jobs to fail.

## Solutions

### Option 1: Use the Dev Script (Recommended)

The easiest way is to use the built-in dev script which already has proper timeout configuration:

```bash
composer dev
```

This runs the queue with `--timeout=0` (no timeout) along with the server, logs, and Vite.

### Option 2: Run Queue Worker Manually

If you need to run just the queue worker:

```bash
php artisan queue:work --timeout=0 --tries=1
```

Or use `queue:listen` which also works well:

```bash
php artisan queue:listen --timeout=0 --tries=1
```

### Option 3: Create a Dedicated Script

Add this to your `composer.json` scripts section:

```json
"queue": "php artisan queue:work --timeout=0 --tries=1 --sleep=3"
```

Then run:

```bash
composer queue
```

## Important Notes

- **Never use** `php artisan queue:work` without the `--timeout=0` flag for import jobs
- The import job itself has a 1-hour timeout (`$timeout = 3600`)
- Using `--timeout=0` on the queue worker allows the job's own timeout to control execution
- The `--tries=1` ensures failed imports don't retry automatically (you can retry manually from the UI)

## Monitoring Jobs

- View job progress in the Admin → Data Import page
- Jobs older than 5 minutes will be marked as "stuck" and can be retried
- Real-time stats show imported/skipped counts during processing
