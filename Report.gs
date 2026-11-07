/**
 * WEEKLY EMAIL REPORT - emailed every Sunday night with a PDF attached.
 * Setup: 1) put your email address(es) in REPORT.TO   2) run createWeeklyTrigger() once   3) run sendWeeklyReport() once to test.
 * Time zone: Project Settings > tick "Show appsscript.json manifest file", then set "timeZone": "Africa/Nairobi".
 */
const REPORT = {
  TO: [
    'bmuiruri@perseaoils.com',
    'gmwangi@perseaoils.com',
    'jwanjiru.persea@gmail.com',
    'pnjenga@perseaoils.com'
  ].join(','),
  SUBJECT: 'Inspection Submissions Report',
  FROM_NAME: 'Persea Field Reports',   // sender name shown in the inbox (the address stays the script owner's)
  OFFSET_H: 3                        // Nairobi = UTC+3 (no daylight saving)
};

/** Creates the weekly trigger: Sunday evening (runs between about 23:00 and midnight). Run once. */
function createWeeklyTrigger() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'sendWeeklyReport').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendWeeklyReport').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(23).nearMinute(45).create();
}

function sendWeeklyReport() {
  const OFF = REPORT.OFFSET_H * 3600e3, D = 864e5;
  const data = getData(true), rows = data.rows, M = data.master.map(a => ({ q: a[0], f: a[1], c: a[2], g: a[3], v: a[4], n: a[5] }));
  // week Mon-Sun containing (now - 2h), so a run just after midnight still reports the week that just ended
  const day = Math.floor((Date.now() - 2 * 3600e3 + OFF) / D);
  const ws = (day - ((day + 3) % 7)) * D - OFF, we = ws + 7 * D;
  const wr = rows.filter(r => r.t >= ws && r.t < we);
  const fmt = (t, p) => Utilities.formatDate(new Date(t), 'Africa/Nairobi', p || 'dd/MM');
  const wn = isoWeek_(ws, OFF);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const done = new Set(rows.map(r => r.q).filter(Boolean)), mset = new Set(M.map(m => m.q));
  const inspected = M.filter(m => done.has(m.q)).length, remaining = M.length - inspected;
  const weekFarmers = new Set(wr.map(r => r.q).filter(Boolean)).size;
  const names = [...new Set(rows.map(r => r.i))].sort();
  const act = {}; names.forEach(n => act[n] = [0, 0, 0, 0, 0, 0, 0]);
  wr.forEach(r => act[r.i][Math.floor((r.t - ws) / D)]++);
  const activeN = names.filter(n => sum_(act[n]) > 0).length;

  // flags: codes submitted more than once (at least one submission this week) and codes not on the master list
  const gq = {}; rows.forEach(r => { if (r.q) (gq[r.q] = gq[r.q] || []).push(r); });
  const dupQ = Object.keys(gq).filter(q => gq[q].length > 1 && gq[q].some(r => r.t >= ws && r.t < we));
  const unknown = [...new Set(wr.map(r => r.q).filter(q => q && !mset.has(q)))];

  const F = 'font-family:Segoe UI,Arial,sans-serif;color:#222;';
  const th = (s, r) => '<th style="padding:6px 8px;font-size:11px;color:#444;text-align:' + (r ? 'right' : 'left') + ';border-bottom:1px solid #ccc">' + s + '</th>';
  const td = (s, r, b) => '<td style="padding:6px 8px;font-size:12px;border-bottom:1px solid #eee;text-align:' + (r ? 'right' : 'left') + ';color:' + ((s === 0 || s === '-') ? '#999' : '#222') + (b ? ';font-weight:bold' : '') + '">' + s + '</td>';
  const table = (head, body) => '<table style="border-collapse:collapse;width:100%;margin:6px 0 18px"><tr>' + head.map(h => th(h[0], h[1])).join('') + '</tr>' + body + '</table>';
  const chip = (v, l, col) => '<td style="background:#f3f4f6;border-radius:4px;padding:8px 14px"><div style="font-size:16px;font-weight:bold;' + (col ? 'color:' + col : '') + '">' + v + '</div><div style="font-size:10px;color:#666">' + l + '</div></td>';
  const h3 = s => '<div style="font-size:15px;font-weight:bold;margin:18px 0 4px">' + s + '</div>';

  // work by inspector (Mon-Sun)
  const colT = [0, 0, 0, 0, 0, 0, 0];
  const insBody = names.slice().sort((a, b) => sum_(act[b]) - sum_(act[a])).map(n => {
    act[n].forEach((v, i) => colT[i] += v);
    return '<tr>' + td(esc(n)) + act[n].map(v => td(v || '-', 1)).join('') + td(sum_(act[n]), 1, 1) + '</tr>';
  }).join('') + '<tr>' + td('<b>Total</b>') + colT.map(v => td('<b>' + v + '</b>', 1)).join('') + td('<b>' + sum_(colT) + '</b>', 1) + '</tr>';
  const dayHead = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => [d + ' ' + fmt(ws + i * D), 1]);

  // progress per county / sub-county
  const area = key => {
    const s = {};
    M.forEach(m => { const k = m[key] || 'UNSPECIFIED', o = s[k] = s[k] || { n: 0, i: 0, w: 0 }; o.n++; if (done.has(m.q)) o.i++; });
    wr.forEach(r => { const k = r[key] || 'UNSPECIFIED'; (s[k] = s[k] || { n: 0, i: 0, w: 0 }).w++; });
    return Object.keys(s).filter(k => s[k].n > 0).sort((a, b) => s[b].n - s[a].n).map(k => { const o = s[k];
      return '<tr>' + td(esc(k)) + td(o.n, 1) + td(o.i, 1) + td(o.n - o.i, 1) + td(o.n ? Math.round(100 * o.i / o.n) + '%' : '-', 1) + td(o.w, 1, 1) + '</tr>'; }).join('');
  };
  const areaHead = l => [[l], ['Farmers', 1], ['Inspected', 1], ['Pending', 1], ['Done', 1], ['This week', 1]];

  // anomalies
  let anomalies = '';
  if (dupQ.length) {
    anomalies += '<div style="font-size:12px;color:#c62828;margin:4px 0">Codes submitted more than once (' + dupQ.length + ')</div>' +
      table([['Code'], ['Farmer'], ['Times', 1], ['Submitted on'], ['Inspector(s)']], dupQ.map(q => { const g = gq[q].sort((a, b) => a.t - b.t);
        return '<tr>' + td('<b style="color:#c62828">' + esc(q) + '</b>') + td(esc(g[0].k.slice(q.length).trim())) + td(g.length, 1, 1) +
          td(g.map(r => fmt(r.t, 'dd/MM HH:mm')).join(', ')) + td([...new Set(g.map(r => r.i))].map(esc).join(', ')) + '</tr>'; }).join(''));
  }
  if (unknown.length) anomalies += '<div style="font-size:12px;color:#c62828;margin:4px 0">Codes not on the master list (' + unknown.length + '): ' + unknown.map(esc).join(', ') + '</div>';
  if (!anomalies) anomalies = '<div style="font-size:12px;color:#2e7d32">No anomalies detected.</div>';

  let url = ''; try { url = ScriptApp.getService().getUrl(); } catch (e) { }
  const html = '<div style="' + F + 'max-width:900px">' +
    '<div style="font-size:20px;font-weight:bold">Inspection Submissions Report</div>' +
    '<div style="font-size:11px;color:#666;margin-bottom:12px">Submissions Mon ' + fmt(ws) + ' to Sun ' + fmt(we - D, 'dd/MM/yyyy') + ' (EAT) - week ' + wn + '</div>' +
    '<table style="border-collapse:separate;border-spacing:8px 0;margin-left:-8px"><tr>' +
    chip(wr.length, 'Submissions') + chip(weekFarmers, 'Farmers inspected (week)') + chip(activeN + '/' + names.length, 'Inspectors active') +
    chip(inspected + '/' + M.length, 'Farmers inspected (total)') + chip(remaining, 'Pending inspection', '#d97706') + chip(dupQ.length, 'Duplicate codes', '#c62828') +
    '</tr></table>' +
    h3('Work by inspector') + table([['Inspector']].concat(dayHead, [['Total', 1]]), insBody) +
    h3('Progress per county') + table(areaHead('County'), area('c')) +
    h3('Progress per sub-county') + table(areaHead('Sub-county'), area('g')) +
    h3('Anomalies to check') + anomalies +
    '<div style="font-size:10px;color:#777;margin-top:14px">Flags are prompts to check, not confirmed problems. Pending inspection = farmers on the master list with no submission yet (all time).' +
    (url ? ' Full records: <a href="' + url + '">dashboard</a>' : '') + ' Generated ' + fmt(Date.now(), 'dd/MM/yyyy HH:mm') + '.</div></div>';

  const pdf = Utilities.newBlob('<html><body>' + html + '</body></html>', 'text/html', 'report.html').getAs('application/pdf').setName('Inspection-Submissions-Report-W' + wn + '.pdf');
  MailApp.sendEmail({
    to: REPORT.TO, name: REPORT.FROM_NAME,
    subject: REPORT.SUBJECT + ' \u2013 ' + fmt(we - D, 'yyyy-MM-dd') + ' \u2013 ' + wr.length + ' submissions',
    htmlBody: html, attachments: [pdf]
  });
}

function sum_(a) { return a.reduce((s, v) => s + v, 0); }
function isoWeek_(ms, off) {
  const D = 864e5, d = new Date(ms + off);
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d - y) / D - 3 + ((y.getUTCDay() + 6) % 7)) / 7);
}