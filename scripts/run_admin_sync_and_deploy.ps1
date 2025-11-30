param(
  [Parameter(Mandatory=$true)]
  [string]$ServiceAccountPath,
  [Parameter(Mandatory=$false)]
  [string]$ProjectId = 'fontenews-877a3',
  [switch]$DryRun
)

$cwd = Get-Location
$node = "node"
$script = Join-Path $cwd 'scripts\admin_sync_authorized_users.js'
$sa = Resolve-Path $ServiceAccountPath

if(-not (Test-Path $script)){
  Write-Error "Script $script not found"
  exit 1
}

if($DryRun.IsPresent){
  $dryArg = '--dryRun'
}else{
  $dryArg = ''
}

Write-Host "Running admin sync (dryRun=$($DryRun.IsPresent))..."
$cmd = "$node `"$script`" --serviceAccount `"$sa`" $dryArg"
Write-Host $cmd
$argList = @($script, '--serviceAccount', "$sa")
if($dryArg -ne ''){ $argList += $dryArg }
$proc = Start-Process -FilePath $node -ArgumentList $argList -NoNewWindow -Wait -PassThru
if($proc.ExitCode -ne 0){
  Write-Error "Sync script failed with exit code $($proc.ExitCode)"
  exit $proc.ExitCode
}

Write-Host "Sync script finished. Checking report..."
$reportPath = Join-Path $cwd 'reports\authorized_users_sync_result.json'
if(-not (Test-Path $reportPath)){
  Write-Error "Report $reportPath not found. Aborting deploy."
  exit 1
}

$report = Get-Content $reportPath -Raw | ConvertFrom-Json
$changes = $report.changes | Where-Object { $_.action -eq 'set' }
if($changes.Count -gt 0 -and -not $DryRun.IsPresent){
  Write-Host "Found $($changes.Count) changes applied. Proceeding to firebase deploy..."
  # Run firebase deploy (make sure firebase-tools is installed and you are logged in)
  Write-Host "Running: firebase deploy --project $ProjectId"
  $deployProc = Start-Process -FilePath 'firebase' -ArgumentList "deploy --project $ProjectId" -NoNewWindow -Wait -PassThru
  if($deployProc.ExitCode -ne 0){
    Write-Error "firebase deploy failed with exit code $($deployProc.ExitCode)"
    exit $deployProc.ExitCode
  }
  Write-Host "Deploy complete."
}else{
  if($DryRun.IsPresent){
    Write-Host "Dry run completed; no deploy performed."
  }else{
    Write-Host "No changes applied by sync. Skipping deploy."
  }
}

exit 0
