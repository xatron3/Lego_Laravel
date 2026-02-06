# --------------------------
# CONFIGURATION
# --------------------------
$server = "153.92.220.42"
$user = "u504494220"
$pass = "Tcix6cpe"  # Consider key-based auth for security
$localLaravel = "D:\Development\lego\lego-laravel\"
$localPublic = "D:\Development\lego\lego-laravel\public"
$remoteRoot = "/home/u504494220/domains/brickoasis.com"

$pscpPath = "C:\Includes\pscp.exe"  # Path to pscp.exe

# --------------------------
# LARAVEL FOLDERS TO UPLOAD
# --------------------------
$laravelFolders = @(
    "app",
    "bootstrap",
    "config",
    "database",
    "resources",
    "routes"
)

$laravelFiles = @(
    "artisan",
    "composer.json",
    "composer.lock"
)

Write-Host "=== Uploading Laravel folders ==="
foreach ($folder in $laravelFolders) {
    $localPath = Join-Path $localLaravel $folder
    $remotePath = "$remoteRoot/laravel/$folder"
    Write-Host "Uploading folder: $folder"
    & $pscpPath -r -pw $pass $localPath ('{0}@{1}:{2}' -f $user,$server,$remotePath)
}

Write-Host "=== Uploading Laravel files ==="
foreach ($file in $laravelFiles) {
    $localPath = Join-Path $localLaravel $file
    $remotePath = "$remoteRoot/laravel/$file"
    Write-Host "Uploading file: $file"
    & $pscpPath -pw $pass $localPath ('{0}@{1}:{2}' -f $user,$server,$remotePath)
}

# --------------------------
# PUBLIC_HTML UPLOAD
# --------------------------
Write-Host "=== Uploading public_html files ==="
$publicItems = Get-ChildItem -Path $localPublic -Force | Where-Object {
    $_.Name -notmatch "node_modules|hot|mix-manifest.json|package.json|package-lock.json"
}

foreach ($item in $publicItems) {
    $localPath = $item.FullName
    $remotePath = "$remoteRoot/public_html/$($item.Name)"

    if ($item.PSIsContainer) {
        Write-Host "Uploading folder: $($item.Name)"
        & $pscpPath -r -pw $pass $localPath ('{0}@{1}:{2}' -f $user,$server,$remotePath)
    } else {
        Write-Host "Uploading file: $($item.Name)"
        & $pscpPath -pw $pass $localPath ('{0}@{1}:{2}' -f $user,$server,$remotePath)
    }
}

Write-Host "=== Upload Complete! ==="
