Add-Type -AssemblyName System.Drawing
$filePath = 'C:\Users\ubaid\.gemini\antigravity-ide\brain\410982c3-afb9-4c0a-b9f0-957134b84636\.user_uploaded\media_1789939106772.png'
$bmp = New-Object System.Drawing.Bitmap($filePath)
$bg = $bmp.GetPixel(10, 10)

for ($y = 350; $y -le 420; $y += 5) {
    $nonBg = 0
    for ($x = 350; $x -le 674; $x++) {
        $c = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs($c.R - $bg.R) + [Math]::Abs($c.G - $bg.G) + [Math]::Abs($c.B - $bg.B)
        if ($diff -gt 40) { $nonBg++ }
    }
    Write-Output "Y=$y : NonBg=$nonBg"
}
$bmp.Dispose()
