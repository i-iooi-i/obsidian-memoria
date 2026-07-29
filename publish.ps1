#Requires -Version 5.1
<#
.SYNOPSIS
  Memoria 一键发版脚本。

.DESCRIPTION
  完整流程：
    1. 从源码目录（memoria-source）执行 lint、类型检查和生产构建
    2. 把 main.js / manifest.json / styles.css / CHANGELOG.md 同步到本目录
    3. 同步到 Obsidian vault 的插件加载目录（方便本地测试）
    4. 读取 manifest.json 得到新版本号 vX.Y.Z
    5. git add / commit / tag / push
    6. 调 GitHub REST API 创建 Release（可选，需要 GITHUB_TOKEN 环境变量）
       同时把三件套作为 Release Assets 上传

.PARAMETER SkipBuild
  跳过 npm run build（假设已经 build 过）

.PARAMETER SkipRelease
  只推送 commit 和 tag，不在 GitHub 创建 Release（Release 手动去网页发）

.PARAMETER DryRun
  只展示会做什么，不真实执行写操作

.EXAMPLE
  .\publish.ps1

.EXAMPLE
  .\publish.ps1 -SkipBuild

.EXAMPLE
  .\publish.ps1 -DryRun

.NOTES
  作者：ZOLO
  首版：v1.4.11 发布日（2026-05-05）
  v1.4.12 修订：规避 PowerShell 解析陷阱
    - 不要用 $Args 做参数名（是内置自动变量，导致 "数组索引表达式丢失或无效"）
    - 双引号字符串里尽量不要同时出现 [] + $()，避免解析器把 [] 当索引表达式
  v2.2.0 修订：路径迁移到 E:\Obsidian 插件开发\，目录名从 memoria-v1.1.1-source 改为 memoria-source
#>

[CmdletBinding()]
param(
  [switch]$SkipBuild,
  [switch]$SkipRelease,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# ============ 配置 ============
# v2.2.0: 路径从 C:\Users\zololiu\Desktop\ 迁移到 E:\Obsidian 插件开发\
$ReleaseDir = 'E:\Obsidian 插件开发\memoria-release'
$SourceDir  = 'E:\Obsidian 插件开发\memoria-source'
$VaultDir   = 'D:\Nextcloud\Note\Ob_Life\.obsidian\plugins\memoria'
$GitHubOwner = 'i-iooi-i'
$GitHubRepo  = 'obsidian-memoria'

# ============ 工具函数 ============
function Write-Step {
  param([string]$Msg)
  Write-Host ""
  Write-Host ("==> " + $Msg) -ForegroundColor Cyan
}

function Write-Info {
  param([string]$Msg, [string]$Color = 'Gray')
  Write-Host ("  " + $Msg) -ForegroundColor $Color
}

function Invoke-GitCmd {
  param([string[]]$GitArgs)
  if ($DryRun) {
    Write-Info ("[DRY] git " + ($GitArgs -join ' ')) 'DarkGray'
    return ""
  }
  # git 经常往 stderr 打进度/警告（例如 "CRLF will be replaced by LF"），
  # 在 $ErrorActionPreference='Stop' 下会被 PS 当 NativeCommandError 抛出。
  # 临时关掉，只靠 $LASTEXITCODE 判断真正的失败。
  $prevEAP = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    & git @GitArgs 2>&1 | ForEach-Object { $_.ToString() }
  } finally {
    $ErrorActionPreference = $prevEAP
  }
  if ($LASTEXITCODE -ne 0) {
    throw ("git " + ($GitArgs -join ' ') + " 失败，exit=" + $LASTEXITCODE)
  }
}

function Copy-One {
  param([string]$From, [string]$To)
  if ($DryRun) {
    Write-Info ("[DRY] Copy " + $From + " -> " + $To) 'DarkGray'
    return
  }
  Copy-Item -Force -Path $From -Destination $To
}

function Copy-Tree {
  param([string]$From, [string]$To)
  if ($DryRun) {
    Write-Info ("[DRY] Copy tree " + $From + " -> " + $To) 'DarkGray'
    return
  }
  if (-not (Test-Path $To)) {
    New-Item -ItemType Directory -Path $To | Out-Null
  }
  Copy-Item -Force -Recurse -Path (Join-Path $From '*') -Destination $To
}

# ============ Step 1. Build ============
Set-Location $ReleaseDir

if (-not $SkipBuild) {
  Write-Step "Step 1/6  检查并编译源码（lint + typecheck + build）"
  Push-Location $SourceDir
  try {
    if ($DryRun) {
      Write-Info "[DRY] npm run lint" 'DarkGray'
      Write-Info "[DRY] npm run typecheck" 'DarkGray'
      Write-Info "[DRY] npm run build" 'DarkGray'
    } else {
      npm run lint
      if ($LASTEXITCODE -ne 0) { throw "npm run lint 失败" }
      npm run typecheck
      if ($LASTEXITCODE -ne 0) { throw "npm run typecheck 失败" }
      npm run build
      if ($LASTEXITCODE -ne 0) { throw "npm run build 失败" }
    }
  } finally {
    Pop-Location
  }
} else {
  Write-Step "Step 1/6  跳过构建 (-SkipBuild)"
}

# ============ Step 2. 同步三件套到 release 目录 ============
Write-Step "Step 2/6  同步发布文件、源码与工程配置到 release 目录"
Copy-One (Join-Path $SourceDir 'main.js')       (Join-Path $ReleaseDir 'main.js')
Copy-One (Join-Path $SourceDir 'manifest.json') (Join-Path $ReleaseDir 'manifest.json')
Copy-One (Join-Path $SourceDir 'styles.css')    (Join-Path $ReleaseDir 'styles.css')
Copy-One (Join-Path $SourceDir 'CHANGELOG.md')  (Join-Path $ReleaseDir 'CHANGELOG.md')
Copy-One (Join-Path $SourceDir 'README.md')     (Join-Path $ReleaseDir 'README.md')
Copy-One (Join-Path $SourceDir 'README.en.md')  (Join-Path $ReleaseDir 'README.en.md')
Copy-One (Join-Path $SourceDir 'package.json')  (Join-Path $ReleaseDir 'package.json')
Copy-One (Join-Path $SourceDir 'package-lock.json') (Join-Path $ReleaseDir 'package-lock.json')
Copy-One (Join-Path $SourceDir 'versions.json') (Join-Path $ReleaseDir 'versions.json')
Copy-One (Join-Path $SourceDir 'esbuild.config.mjs') (Join-Path $ReleaseDir 'esbuild.config.mjs')
Copy-One (Join-Path $SourceDir 'eslint.config.mjs') (Join-Path $ReleaseDir 'eslint.config.mjs')
Copy-One (Join-Path $SourceDir 'tsconfig.json') (Join-Path $ReleaseDir 'tsconfig.json')
Copy-Tree (Join-Path $SourceDir 'src') (Join-Path $ReleaseDir 'src')

# ============ Step 3. 同步到 Obsidian vault ============
Write-Step ("Step 3/6  同步到 Obsidian vault (" + $VaultDir + ")")
if (Test-Path $VaultDir) {
  Copy-One (Join-Path $ReleaseDir 'main.js')       (Join-Path $VaultDir 'main.js')
  Copy-One (Join-Path $ReleaseDir 'manifest.json') (Join-Path $VaultDir 'manifest.json')
  Copy-One (Join-Path $ReleaseDir 'styles.css')    (Join-Path $VaultDir 'styles.css')
  Write-Info "vault 已更新，记得重启 Memoria 插件生效" 'Yellow'
} else {
  Write-Info ("vault 目录不存在，跳过（" + $VaultDir + "）") 'DarkYellow'
}

# ============ Step 4. 读取版本号 ============
Write-Step "Step 4/6  读取 manifest.json 版本号"
$manifestPath = Join-Path $ReleaseDir 'manifest.json'
$manifestRaw = Get-Content $manifestPath -Encoding UTF8 -Raw
$manifest = $manifestRaw | ConvertFrom-Json
$version = $manifest.version
$tag = $version
Write-Info ("版本号：" + $version + "  ->  tag: " + $tag) 'Green'

# ============ Step 5. Git commit + tag + push ============
Write-Step "Step 5/6  git commit + tag + push"

# 检查 versions.json 是否包含新版本，没有就补上
$versionsPath = Join-Path $ReleaseDir 'versions.json'
if (Test-Path $versionsPath) {
  $versionsRaw = Get-Content $versionsPath -Encoding UTF8 -Raw
  $needle = '"' + $version + '"'
  if (-not $versionsRaw.Contains($needle)) {
    Write-Info ("versions.json 不包含 " + $version + "，自动追加") 'Yellow'
    $versions = $versionsRaw | ConvertFrom-Json
    $versions | Add-Member -NotePropertyName $version -NotePropertyValue $manifest.minAppVersion -Force
    if (-not $DryRun) {
      $json = $versions | ConvertTo-Json -Depth 5
      $utf8NoBom = New-Object System.Text.UTF8Encoding $false
      [System.IO.File]::WriteAllText($versionsPath, $json, $utf8NoBom)
    }
  }
}

# 检查是否有改动
Invoke-GitCmd @('add', '-A') | Out-Null
$statusRaw = & git status --short 2>&1 | Out-String
if ([string]::IsNullOrWhiteSpace($statusRaw)) {
  Write-Info "没有需要提交的改动，跳过 commit" 'DarkYellow'
} else {
  $commitMsg = "v" + $version
  Invoke-GitCmd @('commit', '-m', $commitMsg) | Out-Null
  Write-Info ("已 commit: " + $commitMsg) 'Green'
}

# 打 tag（已存在就跳过）
$existingTag = (& git tag --list $tag 2>&1 | Out-String).Trim()
if ($existingTag -eq $tag) {
  Write-Info ("tag " + $tag + " 已存在，跳过打 tag") 'DarkYellow'
} else {
  Invoke-GitCmd @('tag', '-a', $tag, '-m', ("Memoria " + $tag)) | Out-Null
  Write-Info ("已打 tag: " + $tag) 'Green'
}

# Push 分支 + tag
Invoke-GitCmd @('push', 'origin', 'main') | Out-Null
Invoke-GitCmd @('push', 'origin', $tag)   | Out-Null
Write-Info ("已 push main + " + $tag + " 到 origin") 'Green'

# ============ Step 6. GitHub Release ============
$releaseUrl = 'https://github.com/' + $GitHubOwner + '/' + $GitHubRepo + '/releases/new?tag=' + $tag

if ($SkipRelease) {
  Write-Step "Step 6/6  跳过 GitHub Release (-SkipRelease)"
  Write-Info ("手动到 " + $releaseUrl + " 发布") 'Yellow'
  return
}

$token = $env:GITHUB_TOKEN
if (-not $token) {
  Write-Step "Step 6/6  未设置 GITHUB_TOKEN，跳过自动 Release"
  Write-Info ("手动发布：" + $releaseUrl) 'Yellow'
  Write-Host ""
  Write-Info "下次想让脚本自动发 Release，先在 PowerShell 里运行一次：" 'Gray'
  Write-Info "  `$env:GITHUB_TOKEN = 'ghp_xxxxx'     # 需要 Contents: Read and write 权限" 'DarkGray'
  Write-Info "或者加到 `$PROFILE 里永久生效。" 'Gray'

  # 便民：自动打开浏览器 + 记事本（Release Notes）+ 资源管理器（拖三件套）
  $notesPath = Join-Path $ReleaseDir ("RELEASE_NOTES_" + $tag + ".md")
  Start-Process $releaseUrl
  if (Test-Path $notesPath) {
    Start-Process notepad.exe -ArgumentList $notesPath
  }
  Start-Process explorer.exe -ArgumentList $ReleaseDir
  return
}

Write-Step "Step 6/6  通过 GitHub API 创建 Release"

# 从 CHANGELOG.md 里抽出本版本段作为 Release body
$changelogPath = Join-Path $ReleaseDir 'CHANGELOG.md'
$changelogRaw = Get-Content $changelogPath -Encoding UTF8 -Raw
$escapedVer = [regex]::Escape($version)
$pattern = '(?ms)^##\s+v' + $escapedVer + '[^\n]*\n(.+?)(?=\n##\s+v|\z)'
$match = [regex]::Match($changelogRaw, $pattern)
$body = if ($match.Success) { $match.Groups[1].Value.Trim() } else { "See CHANGELOG.md" }

$headers = @{
  'Accept'               = 'application/vnd.github+json'
  'Authorization'        = "Bearer $token"
  'X-GitHub-Api-Version' = '2022-11-28'
}

# 先检查 Release 是否已存在
$releaseApiUrl = 'https://api.github.com/repos/' + $GitHubOwner + '/' + $GitHubRepo + '/releases/tags/' + $tag
$existing = $null
try {
  $existing = Invoke-RestMethod -Uri $releaseApiUrl -Headers $headers -Method Get
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 404) { throw }
}

if ($existing) {
  Write-Info ("Release " + $tag + " 已存在（id=" + $existing.id + "），重用不新建") 'DarkYellow'
  $release = $existing
} else {
  $createPayload = @{
    tag_name   = $tag
    name       = "Memoria " + $tag
    body       = $body
    draft      = $false
    prerelease = $false
  } | ConvertTo-Json -Depth 10
  if ($DryRun) {
    Write-Info "[DRY] POST /releases" 'DarkGray'
    Write-Host $createPayload -ForegroundColor DarkGray
    return
  }
  $release = Invoke-RestMethod `
    -Uri ('https://api.github.com/repos/' + $GitHubOwner + '/' + $GitHubRepo + '/releases') `
    -Headers $headers -Method Post -Body $createPayload -ContentType 'application/json; charset=utf-8'
  Write-Info ("Release 已创建：" + $release.html_url) 'Green'
}

# 上传资产
$assets = @('main.js', 'manifest.json', 'styles.css')
$existingAssets = @{}
foreach ($a in $release.assets) {
  $existingAssets[$a.name] = $a
}

foreach ($name in $assets) {
  $filePath = Join-Path $ReleaseDir $name
  if (-not (Test-Path $filePath)) {
    Write-Info ("! 文件不存在，跳过：" + $filePath) 'Red'
    continue
  }
  if ($existingAssets.ContainsKey($name)) {
    Write-Info ("删除旧 asset：" + $name) 'Gray'
    if (-not $DryRun) {
      $delUrl = 'https://api.github.com/repos/' + $GitHubOwner + '/' + $GitHubRepo + '/releases/assets/' + $existingAssets[$name].id
      Invoke-RestMethod -Uri $delUrl -Headers $headers -Method Delete | Out-Null
    }
  }
  $uploadUrl = $release.upload_url -replace '\{\?name,label\}', ("?name=" + $name)
  $contentType = switch -Regex ($name) {
    '\.js$'   { 'application/javascript; charset=utf-8'; break }
    '\.css$'  { 'text/css; charset=utf-8'; break }
    '\.json$' { 'application/json; charset=utf-8'; break }
    default   { 'application/octet-stream' }
  }
  Write-Info ("上传 asset：" + $name + " (" + $contentType + ")") 'Gray'
  if ($DryRun) {
    Write-Info ("[DRY] PUT " + $uploadUrl) 'DarkGray'
    continue
  }
  $bytes = [System.IO.File]::ReadAllBytes($filePath)
  Invoke-RestMethod -Uri $uploadUrl -Headers $headers -Method Post `
    -Body $bytes -ContentType $contentType | Out-Null
}

Write-Host ""
Write-Host "✅ 发布完成！" -ForegroundColor Green
Write-Info ("Release URL: " + $release.html_url) 'Green'
