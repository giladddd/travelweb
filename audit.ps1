$files = @(
  '%d7%9e%d7%a0%d7%a2%d7%95%d7%9c-%d7%95%d7%9b%d7%91%d7%9c.html',
  '%d7%9e%d7%a0%d7%a2%d7%95%d7%9c.html',
  '%d7%9e%d7%aa%d7%90%d7%9d-%d7%90%d7%95%d7%a0%d7%99%d7%91%d7%a8%d7%a1%d7%9c%d7%99-2.html',
  '%d7%9e%d7%aa%d7%90%d7%9d-%d7%90%d7%95%d7%a0%d7%99%d7%91%d7%a8%d7%a1%d7%9c%d7%99.html',
  '%d7%9e%d7%aa%d7%90%d7%9d-%d7%9c%d7%92%d7%96%d7%99%d7%99%d7%94.html',
  '%d7%a0%d7%a8%d7%aa%d7%99%d7%a7-%d7%a0%d7%92%d7%93-%d7%9e%d7%99%d7%9d.html',
  '%d7%a1%d7%95%d7%9b%d7%9f-%d7%91%d7%99%d7%98%d7%95%d7%97-%d7%90%d7%99%d7%a9%d7%99-%d7%9c%d7%9c%d7%90-%d7%aa%d7%95%d7%a1%d7%a4%d7%aa-%d7%a2%d7%9c%d7%95%d7%aa.html',
  '%d7%a1%d7%98-%d7%91%d7%99%d7%a9%d7%95%d7%9c-%d7%92%d7%93%d7%95%d7%9c.html',
  '%d7%a1%d7%98-%d7%91%d7%99%d7%a9%d7%95%d7%9c-%d7%a7%d7%98%d7%9f.html',
  '%d7%a1%d7%99%d7%9d-%d7%90%d7%99%d7%a0%d7%98%d7%a8%d7%a0%d7%98-%d7%9c%d7%97%d7%95%d7%9c.html',
  '%d7%a1%d7%9b%d7%95%d7%9d-%d7%9e%d7%aa%d7%a7%d7%a4%d7%9c.html',
  '%d7%a4%d7%90%d7%95%d7%a5-%d7%9b%d7%a1%d7%a3.html',
  '%d7%a4%d7%a0%d7%a1-%d7%a8%d7%90%d7%a9.html',
  '%d7%a6%d7%9c%d7%97%d7%aa-%d7%9e%d7%aa%d7%a7%d7%a4%d7%9c%d7%aa-%d7%a7%d7%98%d7%a0%d7%94.html',
  '%d7%a8%d7%a9%d7%99%d7%9e%d7%aa-%d7%95%d7%95%d7%99%d7%96%d7%95%d7%aa.html',
  '%d7%a9%d7%9c%d7%95%d7%a7%d7%a8-3l.html',
  '%d7%a9%d7%a7-%d7%9b%d7%91%d7%99%d7%a1%d7%94.html',
  '1920.html'
)

foreach ($f in $files) {
  $path = "C:\Users\gilad\smart_traveller_local\products\$f"
  if (-not (Test-Path $path)) {
    Write-Output "FILE NOT FOUND: $f"
    continue
  }

  $item = Get-Item $path
  $sizeKB = [math]::Round($item.Length / 1KB, 1)
  $over100 = if ($sizeKB -gt 100) { 'YES' } else { 'no' }

  $content = Get-Content $path -Raw -Encoding UTF8

  # Count remote URLs
  $remoteMatches = [regex]::Matches($content, 'https://the-smart-traveller\.com')
  $remoteCount = $remoteMatches.Count

  # Find ../assets/images/ references and check existence
  $imgMatches = [regex]::Matches($content, '\.\./assets/images/([^\s"''<]+)')
  $missingImgs = @()
  $totalImgs = 0
  foreach ($m in $imgMatches) {
    $imgFile = $m.Groups[1].Value
    $totalImgs++
    $imgPath = "C:\Users\gilad\smart_traveller_local\assets\images\$imgFile"
    if (-not (Test-Path $imgPath)) {
      $missingImgs += $imgFile
    }
  }
  $missingCount = $missingImgs.Count
  $missingList = if ($missingCount -gt 0) { $missingImgs -join ' | ' } else { 'none' }

  # Check for add-to-cart button text
  $hasCart = if ($content -match 'הוסף לסל') { 'YES' } else { 'NO' }

  Write-Output "---"
  Write-Output "File       : $f"
  Write-Output "Size       : ${sizeKB} KB  (>100KB: $over100)"
  Write-Output "Remote URLs: $remoteCount"
  Write-Output "Images     : $totalImgs total, $missingCount missing"
  if ($missingCount -gt 0) {
    foreach ($img in $missingImgs) {
      Write-Output "  MISSING: $img"
    }
  }
  Write-Output "Add-to-cart: $hasCart"
  Write-Output ""
}
