# Inspection Submissions Dashboard

Google Apps Script web app that pulls inspection submissions from KoboToolbox,
shows a live dashboard, and emails a weekly PDF report.

## Files

| File | Purpose |
| --- | --- |
| `Code.gs` | Web app entry point (`doGet`), KoboToolbox fetch, caching, config. |
| `Master.gs` | `MASTER` farmer list `[code, form, county, sub-county, village, name]`. |
| `Report.gs` | Weekly email report with PDF attachment + its time trigger. |
| `Index.html` | Dashboard UI (served by `doGet`). |
| `appsscript.json` | Project manifest (V8, web app, Nairobi time zone). |

## Deploy with clasp

```bash
npm install -g @google/clasp
clasp login
```

1. Open the existing script once to get its ID: **Project Settings > IDs > Script ID**
   (or run `clasp create --type webapp` for a brand-new project).
2. Put that ID into `.clasp.json` (replace `PASTE_YOUR_SCRIPT_ID_HERE`).
3. Push and deploy:

```bash
clasp push
clasp deploy
```

> clasp pushes `.gs` and `.html` as-is. The `appsscript.json` manifest must stay
> at the project root (it is).

## One-time setup inside Apps Script

1. **Project Settings > Script properties** -> add `KOBO_TOKEN` = your KoboToolbox API token.
2. Run `setupCheck()` once and authorize access (confirms the token and logs field names).
3. Deploy as a **Web app** (`Execute as: user deploying`, `Access: anyone`).
4. For the weekly email: set the addresses in `REPORT.TO` (`Report.gs`), run
   `createWeeklyTrigger()` once, then run `sendWeeklyReport()` once to test.

## Notes

- No secrets are committed: `KOBO_TOKEN` is read from Script Properties at runtime.
- Data is cached for `CFG.CACHE_SECONDS` (120s). Run `clearDashboardCache()` to force a refresh.
