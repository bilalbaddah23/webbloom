WEBBLOOM AGENCY SITE — IIS DEPLOYMENT
============================

Static website (HTML, CSS, JavaScript). No .NET runtime or build step is needed.

IIS site:       WebBloomAgency
Physical path:  C:\Sites\BusinessWebsites\webbloom\publish
Hostname:       webbloom.duckdns.org

1. FIRST INSTALL — WINDOWS POWERSHELL AS ADMINISTRATOR ON THE VPS

   New-Item -ItemType Directory -Path "C:\Sites\BusinessWebsites" -Force
   & "C:\Program Files\Git\cmd\git.exe" clone --depth 1 --branch main https://github.com/bilalbaddah23/webbloom.git "C:\Sites\BusinessWebsites\webbloom"
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Sites\BusinessWebsites\webbloom\deployment\Install-IIS.ps1" -HostName "webbloom.duckdns.org"

   The installer uses only this site's own IIS application pool and publish folder.
   It never deletes sites, bindings or certificates, and is safe to run again.

2. HTTPS
   Run simple-acme wacs.exe as Administrator, selecting ONLY WebBloomAgency and its hostname.
   Keep port 80 open for certificate renewals.

3. LATER UPDATES
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Sites\BusinessWebsites\webbloom\deployment\Update-Website.ps1"
   Refresh with Ctrl+F5.

4. HEALTH CHECK
   http://webbloom.duckdns.org/health returns "OK".

TROUBLESHOOTING
   500.19  A section in publish\web.config is locked on this server. Remove the
           <httpProtocol> block first; if it persists, the <staticContent> block.
   401/403 Run Install-IIS.ps1 again so folder permissions are re-applied.
   404 on /health  The extension-less MIME mapping in web.config was removed.
