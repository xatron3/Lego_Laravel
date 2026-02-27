# Quick Production Deployment Checklist

## Overview
This guide provides the exact commands to deploy updates and import Rebrickable data with black color (ID 0) support.

## Prerequisites
- ✅ CSV files uploaded to `data/` directory on server
- ✅ Code deployed (files uploaded)
- ✅ Database connection configured in `.env`

## Deployment Steps

### Step 1: Upload Files to Production
```bash
# Upload your updated code to production server
# - Upload all PHP files (controllers, models, jobs, commands)
# - Upload all React/JS files (resources/js/)
# - Upload migrations (database/migrations/)
```

### Step 2: Run Migrations
Run any pending database migrations (adds `img_url` to sets/minifigs, removes from inventory_parts):

```bash
php artisan migrate --force
```

**Expected output:**
- Migration `2026_02_26_225224_add_img_url_to_rebrickable_tables` - Adds img_url columns
- Migration `2026_02_26_234905_remove_img_url_from_inventory_parts` - Removes img_url from inventory_parts

### Step 3: Fix Color ID 0 and Import Black Parts
This single command will:
1. ✅ Create/verify color ID 0 (Black) exists
2. ✅ Reimport colors (ensures color 0 is in database)
3. ✅ Reimport elements (adds ~10,000+ elements with color 0)
4. ✅ Reimport inventory_parts (adds ~116,000+ black parts to sets)

```bash
php artisan rebrickable:fix-color-zero --reimport-all
```

**Expected output:**
```
Checking for color ID 0 (Black)...
✓ Color ID 0 (Black) already exists in database.

Reimporting all data tables to fix relationships...
Reimporting colors...
  Processing: 275 records imported
  ✓ Completed colors import

Reimporting elements...
  Processing: 108,806 records imported
  ✓ Completed elements import

Reimporting inventory_parts...
  Processing: 1,464,332 records imported
  ✓ Completed inventory_parts import
```

**Time estimate:** 15-30 minutes depending on server performance

### Alternative: Step-by-Step Import

If you prefer more control, run these commands separately:

```bash
# 1. Ensure color 0 exists
php artisan rebrickable:fix-color-zero

# 2. Import colors (with img_url)
php artisan rebrickable:import colors --force

# 3. Import minifigs (with img_url)
php artisan rebrickable:import minifigs --force

# 4. Import sets (with img_url)
php artisan rebrickable:import sets --force

# 5. Import elements (includes black parts)
php artisan rebrickable:import elements --force

# 6. Import inventory_parts (includes black parts in sets)
php artisan rebrickable:import inventory_parts --force
```

### Step 4: Build Frontend Assets
Compile the updated React components:

```bash
npm install
npm run build
```

### Step 5: Clear Caches
Clear all Laravel caches to ensure updates take effect:

```bash
php artisan optimize:clear
# Or individually:
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
```

## Verification

### Verify Color 0 Exists
```bash
php artisan tinker --execute="echo App\Models\Color::find(0) ? 'Color 0 exists' : 'Missing!';"
```

**Expected:** `Color 0 exists`

### Count Black Elements
```bash
php artisan tinker --execute="echo 'Black elements: ' . App\Models\Element::where('color_id', 0)->count();"
```

**Expected:** ~10,000+ black elements

### Count Black Inventory Parts
```bash
php artisan tinker --execute="echo 'Black inventory parts: ' . App\Models\InventoryPart::where('color_id', 0)->count();"
```

**Expected:** ~116,000+ black inventory parts

### Check Sets Have img_url
```bash
php artisan tinker --execute="echo 'Sets with img_url: ' . App\Models\Set::whereNotNull('img_url')->count();"
```

**Expected:** ~26,000+ sets with image URLs

### Check Minifigs Have img_url
```bash
php artisan tinker --execute="echo 'Minifigs with img_url: ' . App\Models\Minifig::whereNotNull('img_url')->count();"
```

**Expected:** ~16,500+ minifigs with image URLs

### Test a Specific Set (e.g., Ahsoka's Starfighter)
```bash
php artisan rebrickable:check-inventory 75419-1 3024 0
```

**Expected output:**
```
Checking inventory for:
  Set: 75419-1
  Part: 3024
  Color: 0 (Black)

Found 2 records:
  - Quantity: 95, Is Spare: No
  - Quantity: 8, Is Spare: Yes
Total: 103 black 3024 parts
```

## Troubleshooting

### Issue: "Color ID 0 not found after import"
**Solution:** Manually check the colors.csv file has a row with id=0:
```bash
head -n 5 data/colors.csv
```
Should contain: `0,Black,05131D,f,t`

### Issue: "Still missing black parts"
**Solution:** Run reimport with force flag:
```bash
php artisan rebrickable:fix-color-zero --reimport-all
```

### Issue: "Images not loading"
**Cause:** Custom CDN `cdn.brickoasis.com` is not set up yet (see [IMAGE-CDN-STRUCTURE.md](IMAGE-CDN-STRUCTURE.md))

**Temporary fix:** Images will automatically fall back to Rebrickable element photos

**Permanent fix:** Set up your CDN to serve part images at:
```
https://cdn.brickoasis.com/images/parts/{color_id}/{part_num}.jpg
```

### Issue: "Database too large after import"
**Cause:** The `img_url` column was temporarily on inventory_parts (1.4M records)

**Solution:** Already fixed by migration that removes it. Verify:
```bash
php artisan tinker --execute="echo Schema::hasColumn('inventory_parts', 'img_url') ? 'Still has column' : 'Column removed';"
```

**Expected:** `Column removed`

## Quick Summary

**Minimum commands for deployment:**
```bash
# 1. Upload files (manual)
# 2. Run migrations
php artisan migrate --force

# 3. Fix color 0 and import all data
php artisan rebrickable:fix-color-zero --reimport-all

# 4. Build frontend
npm run build

# 5. Clear caches
php artisan optimize:clear
```

**Total time:** ~20-40 minutes (mostly waiting for import)

## What Changed

✅ **Sets**: Now use `img_url` from database (Rebrickable CDN URLs)  
✅ **Minifigs**: Now use `img_url` from database (Rebrickable CDN URLs)  
✅ **Parts**: Use custom CDN pattern `cdn.brickoasis.com/images/parts/{color_id}/{part_num}.jpg`  
✅ **Color 0 (Black)**: Fixed import bug, now properly imported  
✅ **Black Parts**: All ~116,000+ black parts now in database  
✅ **Database Size**: Reduced by ~700MB by removing `img_url` from inventory_parts  

## Next Steps

After deployment, you should:
1. ☐ Verify images load correctly for sets/minifigs
2. ☐ Check that black parts show in part lists
3. ☐ Test a large set like Titanic (10294-1) has all parts
4. ☐ Set up CDN at `cdn.brickoasis.com` for part images (see [IMAGE-CDN-STRUCTURE.md](IMAGE-CDN-STRUCTURE.md))

## Support Commands

```bash
# View all Rebrickable commands
php artisan list rebrickable

# Check queue status
php artisan queue:monitor

# View failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all
```
