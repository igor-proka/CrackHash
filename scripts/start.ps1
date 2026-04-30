param(
    [switch]$Monitoring,
    [switch]$LoadTest
)

$ErrorActionPreference = "Stop"

# Скрипт читает корневой .env и запускает docker compose с нужным числом воркеров.
$repoRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $repoRoot ".env"

if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        $line = $_.Trim()
        if ($line.Length -eq 0 -or $line.StartsWith("#")) {
            return
        }

        $parts = $line.Split("=", 2)
        if ($parts.Length -eq 2) {
            [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
        }
    }
}

$workerReplicas = if ($env:WORKER_REPLICAS) { $env:WORKER_REPLICAS } else { "3" }
$profiles = @()

if ($Monitoring -or $LoadTest) {
    $profiles += "monitoring"
}

if ($LoadTest) {
    $profiles += "loadtest"
}

if ($profiles.Count -gt 0) {
    $env:COMPOSE_PROFILES = ($profiles | Select-Object -Unique) -join ","
}

Push-Location $repoRoot
try {
    docker compose up --build --remove-orphans --scale "worker=$workerReplicas" -d
}
finally {
    Pop-Location
}
