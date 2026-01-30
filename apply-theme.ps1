# Nexus Theme Application Script
Write-Host "Applying Nexus Cyan-to-Purple Theme..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "frontend" -Include "*.tsx","*.ts" -Recurse | Where-Object {
  $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch ".next"
}

$replacements = @(
  @{ Old = 'bg-\[#0b0500\]'; New = 'bg-[#030305]' },
  @{ Old = 'bg-\[#050200\]'; New = 'bg-[#0a0b0f]' },
  @{ Old = 'bg-\[#1a1510\]'; New = 'bg-[#12131a]' },
  @{ Old = 'bg-\[#0d0805\]'; New = 'bg-[#12131a]' },
  @{ Old = 'bg-\[#2e3035\]'; New = 'bg-[#1a1b24]' },
  @{ Old = 'bg-\[#313338\]'; New = 'bg-[#1a1b24]' },
  @{ Old = 'bg-\[#35373C\]'; New = 'bg-[#1a1b24]' },
  @{ Old = 'bg-\[#404249\]'; New = 'bg-[#1a1b24]' },
  @{ Old = 'from-\[#f3c178\]'; New = 'from-cyan-500' },
  @{ Old = 'to-\[#f35e41\]'; New = 'to-purple-600' },
  @{ Old = 'from-\[#e0a850\]'; New = 'from-cyan-400' },
  @{ Old = 'to-\[#e0442a\]'; New = 'to-purple-500' },
  @{ Old = 'text-\[#DBDEE1\]'; New = 'text-slate-50' },
  @{ Old = 'text-\[#B5BAC1\]'; New = 'text-slate-400' },
  @{ Old = 'text-\[#949BA4\]'; New = 'text-slate-500' },
  @{ Old = 'text-\[#f3c178\]'; New = 'text-cyan-400' },
  @{ Old = 'border-\[#26272D\]'; New = 'border-cyan-500/10' },
  @{ Old = 'border-\[#1F2023\]'; New = 'border-cyan-500/10' },
  @{ Old = 'border-\[#1a1510\]'; New = 'border-cyan-500/10' },
  @{ Old = 'hover:bg-\[#404249\]'; New = 'hover:bg-[#1a1b24]' },
  @{ Old = 'hover:bg-\[#1a1510\]'; New = 'hover:bg-[#12131a]' },
  @{ Old = 'hover:bg-\[#35373C\]'; New = 'hover:bg-[#1a1b24]' },
  @{ Old = 'ring-\[#f3c178\]'; New = 'ring-cyan-500' },
  @{ Old = 'focus:border-\[#f3c178\]'; New = 'focus:border-cyan-500' },
  @{ Old = 'focus-within:ring-\[#f3c178\]'; New = 'focus-within:ring-cyan-500' }
)

$totalChanges = 0

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
  if (-not $content) { continue }
  
  $originalContent = $content
  $fileChanges = 0
  
  foreach ($replacement in $replacements) {
    if ($content -match $replacement.Old) {
      $content = $content -replace $replacement.Old, $replacement.New
      $fileChanges++
    }
  }
  
  if ($content -ne $originalContent) {
    Set-Content -Path $file.FullName -Value $content -NoNewline
    $totalChanges++
    Write-Host "Updated: $($file.Name) - $fileChanges changes" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "Theme applied! Total files updated: $totalChanges" -ForegroundColor Yellow
