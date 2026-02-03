# Script to check and remove BOM from source files
$sourcePath = "resources/js"
$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx")

Write-Host "Scanning for files with BOM in $sourcePath..." -ForegroundColor Cyan

$filesFixed = 0
$totalFiles = 0

foreach ($ext in $extensions) {
    $files = Get-ChildItem -Path $sourcePath -Filter $ext -Recurse -File

    foreach ($file in $files) {
        $totalFiles++

        # Read file as bytes
        $bytes = [System.IO.File]::ReadAllBytes($file.FullName)

        # Check for UTF-8 BOM (EF BB BF)
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            Write-Host "Removing BOM from: $($file.FullName)" -ForegroundColor Yellow

            # Remove first 3 bytes (the BOM)
            $newBytes = $bytes[3..($bytes.Length - 1)]

            # Write back without BOM
            [System.IO.File]::WriteAllBytes($file.FullName, $newBytes)
            $filesFixed++
        }
    }
}

Write-Host "`nSummary:" -ForegroundColor Green
Write-Host "Total source files scanned: $totalFiles" -ForegroundColor White
Write-Host "Files with BOM removed: $filesFixed" -ForegroundColor Yellow

if ($filesFixed -gt 0) {
    Write-Host "`nBOM removal complete! Run 'npm run build' to rebuild." -ForegroundColor Green
} else {
    Write-Host "`nNo source files with BOM found." -ForegroundColor Green
}
