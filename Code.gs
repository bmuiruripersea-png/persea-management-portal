/**
 * INSPECTION SUBMISSIONS - live dashboard from KoboToolbox.
 * Setup: Project Settings > Script properties > add KOBO_TOKEN (Kobo > Account Settings > Security > API token).
 * Then run setupCheck() once (authorizes access + logs your field names), then Deploy > Web app.
 */
const CFG = {
  SERVER: 'https://kf.kobotoolbox.org',   // use https://eu.kobotoolbox.org if your account is on the EU server
  FORMS: [
    { name: 'Muikinyeri',  uid: 'ae9hZDpd6cbXirGJukHzC4' },
    { name: 'Kiamunyekie', uid: 'aFwiW4DYZHCwqB9ry7Tw3P' }
  ],
  // Field names taken from your XLSForms (matched on the last part of the path, case-insensitive).
  FIELDS: {
    inspector: ['inspector_name'],
    subcounty: ['subcounty_update', 'subcounty'],   // updated value wins when the inspector changed it
    village:   ['village_update', 'village'],
    county:    ['county'],
    code:      ['code'],
    farmer:    ['farmer_first_two_names', 'name'],
    risk:      ['risk_category_001'],
    decision:  ['inspectors_decision_recommendation']
  },
  // Counties treated as one: any county name containing one of these words is shown under the group name
  COUNTY_GROUPS: [['EMBU/CHUKA', ['EMBU', 'CHUKA', 'THARAKA']]],
  // Sub-county spelling fixes (upper-case spelling on the left becomes the one on the right).
  // Spellings that only differ by spaces, hyphens or capitals from a master-list name are fixed automatically.
  SUBCOUNTY_ALIASES: {
    'MUKURWEINI': 'MUKURWE-INI',
    'KIRINYANGA WEST': 'KIRINYAGA WEST',
    'THARAKA NIITHI': 'THARAKA NITHI',
    'MWEMA EAST': 'MWEA EAST'
  },
  EXCLUDE_INSPECTORS: ['benics_demo'],   // demo/test account - remove from this list to include it
  CACHE_SECONDS: 120
};

/** andrea_mwaila -> Andrea Mwaila ; not_approved -> Not Approved */
function nice(s) {
  return String(s || '').replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, m => m.toUpperCase());
}

const letters_ = s => String(s || '').toUpperCase().replace(/[^A-Z]/g, '');
let SUB_CANON_ = null;
function mapSub_(s) {
  if (!SUB_CANON_) {
    SUB_CANON_ = {};
    MASTER.forEach(m => { const n = CFG.SUBCOUNTY_ALIASES[m[3]] || m[3]; SUB_CANON_[letters_(n)] = n; });
  }
  s = String(s || '').replace(/\s+/g, ' ').trim();
  return CFG.SUBCOUNTY_ALIASES[s] || SUB_CANON_[letters_(s)] || s;
}

function mapCounty_(c) {
  for (const g of CFG.COUNTY_GROUPS) if (g[1].some(w => c.indexOf(w) > -1)) return g[0];
  return c;
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Inspection Submissions Report')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getData(force) {
  const o = getRows_(force);
  o.master = MASTER;
  return o;
}

function getRows_(force) {
  const cache = CacheService.getScriptCache();
  if (!force) {
    const n = Number(cache.get('ins_n'));
    if (n) {
      const parts = [];
      for (let i = 0; i < n; i++) parts.push(cache.get('ins_' + i));
      if (parts.every(p => p)) return JSON.parse(parts.join(''));
    }
  }
  const token = PropertiesService.getScriptProperties().getProperty('KOBO_TOKEN');
  if (!token) throw new Error('Add KOBO_TOKEN in Project Settings > Script properties');

  const rows = [];
  CFG.FORMS.forEach(form => {
    let url = CFG.SERVER + '/api/v2/assets/' + form.uid + '/data/?format=json&limit=1000';
    while (url) {
      const res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Token ' + token }, muteHttpExceptions: true });
      if (res.getResponseCode() !== 200) throw new Error(form.name + ': Kobo returned ' + res.getResponseCode() + ' - check UID, server and token');
      const j = JSON.parse(res.getContentText());
      (j.results || []).forEach(r => {
        const idx = {};
        Object.keys(r).forEach(k => { idx[k.split('/').pop().toLowerCase()] = r[k]; });
        const pick = c => { for (const n of c) { const v = idx[n]; if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim(); } return ''; };
        let ts = String(r._submission_time || '');
        if (!/Z|[+-]\d\d:?\d\d$/.test(ts)) ts += 'Z';
        const insp = pick(CFG.FIELDS.inspector) || String(r._submitted_by || 'unknown');
        if (CFG.EXCLUDE_INSPECTORS.indexOf(insp) > -1) return;
        rows.push({
          f: form.name,
          t: Date.parse(ts),
          i: nice(insp),
          g: mapSub_(pick(CFG.FIELDS.subcounty).toUpperCase()) || 'UNSPECIFIED',
          v: pick(CFG.FIELDS.village).toUpperCase() || 'UNSPECIFIED',
          c: mapCounty_(pick(CFG.FIELDS.county).toUpperCase()),
          q: pick(CFG.FIELDS.code).toUpperCase(),
          k: (pick(CFG.FIELDS.code) + ' ' + pick(CFG.FIELDS.farmer)).trim(),
          r: nice(pick(CFG.FIELDS.risk)),
          d: nice(pick(CFG.FIELDS.decision))
        });
      });
      url = j.next || null;
    }
  });
  const out = { rows: rows.filter(r => !isNaN(r.t)), updated: Date.now() };
  try {
    const s = JSON.stringify(out), parts = {};
    let n = 0;
    for (let p = 0; p < s.length; p += 80000) parts['ins_' + n++] = s.substr(p, 80000);
    parts.ins_n = String(n);
    cache.putAll(parts, CFG.CACHE_SECONDS);
  } catch (e) { /* too large to cache: still return live data */ }
  return out;
}

/** Run once from the editor: authorizes and logs the field names of the latest submission in each form. */
function setupCheck() {
  const token = PropertiesService.getScriptProperties().getProperty('KOBO_TOKEN');
  CFG.FORMS.forEach(form => {
    const res = UrlFetchApp.fetch(CFG.SERVER + '/api/v2/assets/' + form.uid + '/data/?format=json&limit=1', { headers: { Authorization: 'Token ' + token }, muteHttpExceptions: true });
    Logger.log(form.name + ' -> HTTP ' + res.getResponseCode());
    const r = (JSON.parse(res.getContentText()).results || [])[0];
    if (r) Logger.log(Object.keys(r).filter(k => k.charAt(0) !== '_').join('\n'));
  });
}