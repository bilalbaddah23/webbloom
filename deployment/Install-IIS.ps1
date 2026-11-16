# Creates (or repairs) the IIS site for this static website in the "publish" folder.
# Works with Windows PowerShell 4/5 and IIS 8.5 or newer. Run on the VPS as Administrator.
# Safe to run again: it never deletes sites, bindings or certificates.
[CmdletBinding()]
param(
    [switch]$PreviewOnly,
    [string]$HostName,
    [switch]$OpenFirewall
)
$ErrorActionPreference = 'Stop'

$admin = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $admin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Open Windows PowerShell using Run as administrator.' }

$siteRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$configPath = Join-Path $PSScriptRoot 'site.json'
if (-not (Test-Path -LiteralPath $configPath -PathType Leaf)) { throw 'deployment\site.json is missing. Keep the deployment folder inside its website folder.' }
$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$name = [string]$config.iisName
$physicalPath = [IO.Path]::GetFullPath((Join-Path $siteRoot 'publish'))

foreach ($required in @('web.config', 'index.html', 'styles.css', 'main.js', 'health')) {
    if (-not (Test-Path -LiteralPath (Join-Path $physicalPath $required) -PathType Leaf)) {
        throw ('publish\' + $required + ' is missing. Run Update-Website.ps1 (or git pull) so the folder is complete.')
    }
}

if ([string]::IsNullOrWhiteSpace($HostName)) { $HostName = [string]$config.domain }
if ($HostName -notmatch '^(?=.{1,253}$)([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$') { throw 'Use a DNS host name, without https:// or a path.' }
if ($PreviewOnly) { $bindingIp = '127.0.0.1'; $bindingPort = [int]$config.previewPort; $bindingHost = '' }
else { $bindingIp = '*'; $bindingPort = 80; $bindingHost = $HostName.ToLowerInvariant() }
$bindingInfo = $bindingIp + ':' + $bindingPort + ':' + $bindingHost

Import-Module WebAdministration -ErrorAction Stop

$existing = Get-Website -Name $name -ErrorAction SilentlyContinue
if ($existing) {
    $oldPath = [IO.Path]::GetFullPath([Environment]::ExpandEnvironmentVariables([string]$existing.physicalPath)).TrimEnd('\')
    if ($oldPath -ine $physicalPath.TrimEnd('\')) {
        throw ('An IIS site named ' + $name + ' already uses a different folder (' + $oldPath + '). No changes made.')
    }
}

$allSites = @(Get-Website)
foreach ($other in $allSites) {
    foreach ($binding in @($other.bindings.Collection)) {
        if ([string]$binding.protocol -ne 'http') { continue }
        $parts = ([string]$binding.bindingInformation) -split ':', 3
        if ($parts.Count -ne 3 -or [string]$parts[1] -ne [string]$bindingPort) { continue }
        $hostMatches = $parts[2] -ieq $bindingHost
        $ipOverlaps = $parts[0] -eq '*' -or $bindingIp -eq '*' -or $parts[0] -eq $bindingIp
        if ($hostMatches -and $ipOverlaps -and $other.name -ine $name) {
            throw ('Binding conflict with existing IIS site ' + $other.name + '. No changes made.')
        }
    }
}

$backupName = 'Before-' + $name + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
Backup-WebConfiguration -Name $backupName | Out-Null
Write-Host ('IIS configuration backup: ' + $backupName)

# One pool per site. Static files need no .NET runtime, so "No Managed Code".
$poolPath = 'IIS:\AppPools\' + $name
if (-not (Test-Path -LiteralPath $poolPath)) { New-WebAppPool -Name $name | Out-Null }
Set-ItemProperty -LiteralPath $poolPath -Name managedRuntimeVersion -Value ''
Set-ItemProperty -LiteralPath $poolPath -Name processModel.identityType -Value 4

# Static files are read by the pool identity and by the anonymous user (IUSR).
& icacls.exe $physicalPath /grant "IIS AppPool\${name}:(OI)(CI)(RX)" "IUSR:(OI)(CI)(RX)" /T /C /Q
if ($LASTEXITCODE -ne 0) { throw 'Could not grant IIS read access. Check the folder permissions before continuing.' }

if (-not $existing) {
    New-Website -Name $name -PhysicalPath $physicalPath -ApplicationPool $name -IPAddress $bindingIp -Port $bindingPort -HostHeader $bindingHost | Out-Null
} else {
    Set-ItemProperty -LiteralPath ('IIS:\Sites\' + $name) -Name applicationPool -Value $name
    $already = @(Get-WebBinding -Name $name -Protocol http | Where-Object { $_.bindingInformation -eq $bindingInfo })
    if ($already.Count -eq 0) { New-WebBinding -Name $name -Protocol http -IPAddress $bindingIp -Port $bindingPort -HostHeader $bindingHost }
}

if ((Get-WebAppPoolState -Name $name).Value -ne 'Started') { Start-WebAppPool -Name $name }
if ((Get-Website -Name $name).State -ne 'Started') { Start-Website -Name $name }

if ($OpenFirewall -and -not $PreviewOnly) {
    foreach ($port in @(80, 443)) {
        $rule = 'Artisan websites TCP ' + $port
        if (-not (Get-NetFirewallRule -DisplayName $rule -ErrorAction SilentlyContinue)) {
            New-NetFirewallRule -DisplayName $rule -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow | Out-Null
        }
    }
}

# Ask the site for /health through IIS on this machine.
if ($PreviewOnly) { $testUrl = 'http://127.0.0.1:' + $bindingPort + '/health'; $testHost = $null }
else { $testUrl = 'http://127.0.0.1/health'; $testHost = $bindingHost }
$status = 0
try {
    $request = [Net.HttpWebRequest]::Create($testUrl)
    if ($testHost) { $request.Host = $testHost }
    $request.Timeout = 30000
    $request.AllowAutoRedirect = $false
    $response = $request.GetResponse()
    $status = [int]$response.StatusCode
    $response.Close()
} catch [Net.WebException] {
    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
}

if ($PreviewOnly) { $url = 'http://127.0.0.1:' + $bindingPort + '/' }
else { $url = 'http://' + $HostName + '/' }
Write-Host ''
if ($status -eq 200) {
    Write-Host ('OK - the site answered through IIS. Open: ' + $url) -ForegroundColor Green
} else {
    Write-Host ('The site did not answer with 200 OK (status: ' + $status + ').') -ForegroundColor Yellow
    Write-Host 'Status 500 usually means a web.config section is locked on this server;'
    Write-Host 'status 401/403 means the folder permissions were not applied. See deployment\README.txt.'
}
Write-Host ('Physical folder: ' + $physicalPath)
Write-Host 'HTTPS: issue a certificate with your existing simple-acme, selecting this site only.'
