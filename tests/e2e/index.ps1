$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$workspace = 'C:\legibility-work'
$report = 'C:\legibility-reports\' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '.txt'
Start-Transcript -Path $report -NoClobber

try {
    if (Test-Path $workspace) {
        throw 'Workspace already exists. Close Windows Sandbox and reopen it for a fresh run.'
    }

    $architecture = 'x64'
    $checksum = 'dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a'
    if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') {
        $architecture = 'arm64'
        $checksum = 'a9427139595156ef484e1fb08957676e09d4232368dd1743a2a9f93f3d241b14'
    }
    $nodeArchive = "node-v26.13.0-win-$architecture"
    $archivePath = Join-Path $env:TEMP "$nodeArchive.zip"
    Invoke-WebRequest "https://nodejs.org/dist/v26.13.0/$nodeArchive.zip" -OutFile $archivePath
    if ((Get-FileHash $archivePath -Algorithm SHA256).Hash -ne $checksum) {
        throw 'Node archive checksum does not match the pinned release.'
    }
    Expand-Archive $archivePath -DestinationPath $env:LOCALAPPDATA
    $nodeDirectory = Join-Path $env:LOCALAPPDATA $nodeArchive
    $env:Path = "$nodeDirectory;$env:Path"

    New-Item -ItemType Directory -Path $workspace | Out-Null
    $inputs = @('src', 'scripts', 'docs', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml')
    foreach ($inputPath in $inputs) {
        Copy-Item (Join-Path 'C:\legibility-source' $inputPath) $workspace -Recurse
    }
    Set-Location $workspace
    [Environment]::OSVersion.VersionString
    $PSVersionTable.PSVersion.ToString()
    node --version
    Get-FileHash .\pnpm-lock.yaml -Algorithm SHA256

    npx.cmd --yes pnpm@12.5.1 install --frozen-lockfile --ignore-scripts
    if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed: $LASTEXITCODE" }
    node --experimental-strip-types .\scripts\build\index.ts --cli-only
    if ($LASTEXITCODE -ne 0) { throw "CLI build failed: $LASTEXITCODE" }
    Get-FileHash .\bin\js\legibility -Algorithm SHA256

    $prefix = Join-Path $env:LOCALAPPDATA 'legibility-bin'
    $env:LEGIBILITY_CLI = Join-Path $workspace 'bin\js\legibility'
    $env:LEGIBILITY_BASE_PATH = "$prefix;$env:Path"
    $env:Path = "$workspace\node_modules\.bin;$env:LEGIBILITY_BASE_PATH"

    $configuration = @{
        languages = @('javascript')
        linters = @{ 'oxlint-plugin-legibility' = @{ args = @('-c', '.oxlintrc.json', 'index.js') } }
        updates = @{ enabled = $false }
    } | ConvertTo-Json -Depth 6
    foreach ($scenario in @('fresh', 'configured', 'clean')) {
        $directory = Join-Path $workspace $scenario
        New-Item -ItemType Directory -Path $directory | Out-Null
        Set-Content "$directory\package.json" '{"private":true,"type":"module"}' -Encoding ASCII
        Set-Content "$directory\.oxlintrc.json" '{"rules":{"no-debugger":"error"}}' -Encoding ASCII
        Set-Content "$directory\index.js" 'debugger;' -Encoding ASCII
        if ($scenario -ne 'fresh') {
            Set-Content "$directory\legibility.json" $configuration -Encoding ASCII
        }
    }
    Set-Content "$workspace\clean\index.js" 'export const message = "hello";' -Encoding ASCII
    Set-Location "$workspace\fresh"

    npm.cmd install --global --prefix $prefix --ignore-scripts --no-audit --no-fund $workspace
    if ($LASTEXITCODE -ne 0) { throw "CLI installation failed: $LASTEXITCODE" }

    Write-Host "Ready. Run legibility, or: node `$env:LEGIBILITY_CLI --help"
    Write-Host "Scenarios: $workspace\fresh, $workspace\configured, $workspace\clean"
    Write-Host 'Missing tools: $env:Path = $env:LEGIBILITY_BASE_PATH'
    Write-Host "Transcript: $report (saved on the host). Run Stop-Transcript before sharing it."
} catch {
    Write-Host "Setup failed: $_" -ForegroundColor Red
    Write-Host "Transcript: $report. This PowerShell window remains open for investigation."
    Stop-Transcript
}
