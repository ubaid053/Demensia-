Add-Type -AssemblyName System.Drawing
$filePath = 'C:\Users\ubaid\.gemini\antigravity-ide\brain\410982c3-afb9-4c0a-b9f0-957134b84636\.user_uploaded\media_1789939106772.png'
$bmp = New-Object System.Drawing.Bitmap($filePath)

$bg = $bmp.GetPixel(10, 10)
Write-Output "Background: R=$($bg.R), G=$($bg.G), B=$($bg.B)"

# Scan from top down to find top of logo
$top = -1
for ($y = 0; $y -lt 350; $y++) {
    for ($x = 300; $x -lt 724; $x++) {
        $c = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs($c.R - $bg.R) + [Math]::Abs($c.G - $bg.G) + [Math]::Abs($c.B - $bg.B)
        if ($diff -gt 35) {
            $top = $y
            break
        }
    }
    if ($top -ne -1) { break }
}

# Scan from bottom of logo (above text, say around y=380 up) to find bottom of logo
# Let's see where text starts around y=370-420
$textTop = -1
for ($y = 350; $y -lt 450; $y++) {
    for ($x = 300; $x -lt 724; $x++) {
        $c = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs($c.R - $bg.R) + [Math]::Abs($c.G - $bg.G) + [Math]::Abs($c.B - $bg.B)
        if ($diff -gt 40) {
            $textTop = $y
            break
        }
    }
    if ($textTop -ne -1) { break }
}

# Find bottom of circular emblem by scanning from y=370 up towards 300
$logoBottom = -1
for ($y = 375; $y -gt 250; $y--) {
    for ($x = 350; $x -lt 674; $x++) {
        $c = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs($c.R - $bg.R) + [Math]::Abs($c.G - $bg.G) + [Math]::Abs($c.B - $bg.B)
        if ($diff -gt 40) {
            $logoBottom = $y
            break
        }
    }
    if ($logoBottom -ne -1) { break }
}

# Find left and right between $top and $logoBottom
$left = 1000
$right = 0
for ($y = $top; $y -le $logoBottom; $y++) {
    for ($x = 250; $x -lt 750; $x++) {
        $c = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs($c.R - $bg.R) + [Math]::Abs($c.G - $bg.G) + [Math]::Abs($c.B - $bg.B)
        if ($diff -gt 35) {
            if ($x -lt $left) { $left = $x }
            if ($x -gt $right) { $right = $x }
        }
    }
}

Write-Output "Logo bounds: Top=$top, Bottom=$logoBottom, Left=$left, Right=$right, TextTop=$textTop"
$bmp.Dispose()
