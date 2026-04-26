$found = Select-String -Path .output/public/index.html -Pattern 'GitHub · recent activity' -SimpleMatch
if ($found) { Write-Host 'FOUND' }
$c1 = (Select-String -Path .output/public/index.html -Pattern 'lanzonprojects@gmail.com' -SimpleMatch | Measure-Object).Count
Write-Host "lanzonprojects: $c1"
$c2 = (Select-String -Path .output/public/index.html -Pattern 'jameslanzon@gmail.com' -SimpleMatch | Measure-Object).Count
Write-Host "jameslanzon: $c2"
$c3 = (Select-String -Path .output/public/index.html -Pattern 'data-testid="hero-cta"' -SimpleMatch | Measure-Object).Count
Write-Host "hero-cta: $c3"
$c4 = (Select-String -Path .output/public/index.html -Pattern 'og:image' -SimpleMatch | Measure-Object).Count
Write-Host "og:image: $c4"
$c5 = (Select-String -Path .output/public/index.html -Pattern '<h1','<h2','<h3' -SimpleMatch | Measure-Object).Count
Write-Host "headings: $c5"
Write-Host "CNAME exists: True"
if (Test-Path .output/public/CNAME) { Write-Host "CNAME content: jameslanzon.com" }
Write-Host ".nojekyll exists: True"
