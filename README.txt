PERSEA MANAGEMENT PORTAL - GITHUB PAGES (repository root)

Files (upload ALL of them to the ROOT of the repository, not inside a folder):
  index.html, manifest.webmanifest, sw.js,
  icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png, favicon-32.png

HOW TO UPLOAD
1. Open github.com/bmuiruripersea-png/persea-management-portal
2. Make sure you are on the main repository page (not inside persea-dashboard-app).
3. Click the + button next to "Go to file" > Upload files. (Direct link:
   https://github.com/bmuiruripersea-png/persea-management-portal/upload/main )
4. Drag in the files (not the folder), then click Commit changes.
5. GitHub Pages is already on. After 1-2 minutes open:
   https://bmuiruripersea-png.github.io/persea-management-portal/
6. Install it: Chrome/Edge install icon in the address bar; Android menu > Install app;
   iPhone Safari > Share > Add to Home Screen.

LINKS (edit index.html with the pencil icon on GitHub; search for "href=")
  Open Dashboard card -> shows the dashboard embedded inside the portal (link set in the DASH line of index.html)
  Open Kobo                           -> https://kf.kobotoolbox.org/

EMBEDDING THE DASHBOARD (important)
The dashboard can only appear inside the portal if the dashboard's Apps Script project allows it.
In the INSPECTION SUBMISSION project, Code.gs must contain a single doGet with
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
(the corrected Code.gs provided in the chat has it). Then Deploy > Manage deployments > pencil > New version > Deploy.
The deployment must also have "Who has access: Anyone" (shown in the project's appsscript.json as "access": "ANYONE").
