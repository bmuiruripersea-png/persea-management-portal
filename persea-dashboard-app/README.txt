PERSEA INSPECTION DASHBOARD - INSTALLABLE APP
=============================================

WHAT THIS IS
Small web-app package that puts an icon (avocado) on a phone, tablet or computer.
Tapping the icon opens your dashboard in its own window, without browser tabs.
Apps Script cannot serve an installable app by itself, so these files are hosted separately (free).

STEP 1 - PUT YOUR DASHBOARD LINK IN
1. Open index.html in Notepad.
2. Replace PASTE_YOUR_DASHBOARD_EXEC_URL_HERE with your dashboard link (the one ending in /exec).
3. Save the file.

STEP 2 - UPDATE THE DASHBOARD SCRIPT
In Apps Script, paste the new Code.gs, save, then Deploy > Manage deployments > pencil icon >
New version > Deploy. (This allows the dashboard to open inside the app window.)

STEP 3 - HOST THE FILES (any one of these, all free, all https)
A) Netlify Drop (quickest): go to app.netlify.com/drop and drag this whole folder onto the page.
   You get a link like https://something.netlify.app
B) GitHub Pages: create a repository, upload these files, then Settings > Pages > Deploy from branch.
C) Your company website: upload the files to a folder, e.g. https://perseaoils.com/inspections/

STEP 4 - INSTALL THE ICON
Computer (Chrome / Edge): open the hosted link, click the install icon at the right end of the
  address bar (or menu > Cast, save and share > Install page as app). Tick "Pin to taskbar" if asked.
Android (Chrome): open the link, menu (3 dots) > Install app (or Add to Home screen).
iPhone / iPad (Safari): open the link, Share button > Add to Home Screen.
Share the hosted link with colleagues so they can install it too.

IF THE APP SHOWS A GOOGLE SIGN-IN ERROR
Google does not allow its sign-in page inside another page. Fix: in index.html change
const MODE = 'iframe';  to  const MODE = 'redirect';  and upload again.
(The dashboard then opens normally from the icon, with a thin browser bar on some phones.)
Or deploy the dashboard with "Who has access: Anyone" if that is acceptable for your data.

OPTIONAL - ICON ON THE BROWSER TAB
After hosting, put the full https link to icon-192.png in FAVICON_URL in Code.gs and redeploy.

NO HOSTING? QUICK ALTERNATIVE (computer only)
Open the dashboard in Chrome > menu > Cast, save and share > Create shortcut > tick "Open as window".
This gives a desktop icon, but with the default Google icon.

FILES
index.html, manifest.webmanifest, sw.js  - the app
icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png, favicon-32.png - icons
