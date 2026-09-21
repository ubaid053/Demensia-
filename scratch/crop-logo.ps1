Add-Type -AssemblyName System.Drawing
$filePath = 'C:\Users\ubaid\.gemini\antigravity-ide\brain\410982c3-afb9-4c0a-b9f0-957134b84636\.user_uploaded\media_1789939106772.png'
$src = New-Object System.Drawing.Bitmap($filePath)

# Ensure assets dir exists
$assetsDir = 'c:\Users\ubaid\OneDrive\Desktop\Demensia\assets'
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir | Out-Null
}

$cropX = 368
$cropY = 72
$cropW = 288
$cropH = 300

# Create destination bitmap with 32-bit ARGB
$dest = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Background color in corners
$bgR = 246.0
$bgG = 246.0
$bgB = 240.0

for ($y = 0; $y -lt $cropH; $y++) {
    for ($x = 0; $x -lt $cropW; $x++) {
        $c = $src.GetPixel($cropX + $x, $cropY + $y)
        
        # Calculate color difference from background
        $dist = [Math]::Sqrt([Math]::Pow($c.R - $bgR, 2) + [Math]::Pow($c.G - $bgG, 2) + [Math]::Pow($c.B - $bgB, 2))
        
        if ($dist -lt 14) {
            # Fully transparent background
            $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($dist -lt 38) {
            # Smooth antialiasing feather edge
            $alpha = [int](($dist - 14.0) / (38.0 - 14.0) * 255.0)
            if ($alpha -gt 255) { $alpha = 255 }
            if ($alpha -lt 0) { $alpha = 0 }
            $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
        } else {
            # Logo foreground
            $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
        }
    }
}

$destPath = Join-Path $assetsDir 'logo.png'
$dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Successfully saved transparent logo to $destPath"

# Also save an uncropped circular badge version with original background just in case
$destBadge = New-Object System.Drawing.Bitmap($cropW, $cropH)
$g = [System.Drawing.Graphics]::FromImage($destBadge)
$g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)), (New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)), [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$badgePath = Join-Path $assetsDir 'logo-badge.png'
$destBadge.Save($badgePath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Output "Successfully saved badge logo to $badgePath"

$src.Dispose()
$dest.Dispose()
$destBadge.Dispose()
