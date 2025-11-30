Admin sync: authorizedUsers -> firebaseUid

Files:
- scripts/admin_sync_authorized_users.js  - Node script using Firebase Admin SDK to sync `authorizedUsers` docs.
- scripts/run_admin_sync_and_deploy.ps1 - PowerShell wrapper to run the script and deploy on success.

Usage (manual):
1. Create a Service Account JSON in GCP (IAM & Admin -> Service Accounts) with role `Firebase Admin` or at least `Firebase Authentication Admin` and `Cloud Datastore Owner` / `Firestore Admin`.
2. Save the JSON to the project folder, e.g. `./service-account.json`.
3. Dry run to preview changes:

```powershell
node .\scripts\admin_sync_authorized_users.js --serviceAccount .\service-account.json --dryRun
```

4. To actually run and update Firestore:

```powershell
node .\scripts\admin_sync_authorized_users.js --serviceAccount .\service-account.json
```

5. To run the PowerShell wrapper which will run the sync and then deploy if the sync made changes successfully:

```powershell
# Provide the full or relative path to your service account json
.\scripts\run_admin_sync_and_deploy.ps1 -ServiceAccountPath .\service-account.json -ProjectId fontenews-877a3
```

Notes:
- The wrapper will only call `firebase deploy` when not in dry-run and when the script completes. It will not deploy if the script errors.
- Keep your service account JSON secure. Do not commit it to git.
