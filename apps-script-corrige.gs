// =============================================================================
// iPropre — Apps Script backend (version corrigée)
// =============================================================================
// Corrections vs ta version actuelle :
//   1. Suppression du toLowerCase() qui cassait `setStatus`, etc.
//   2. Auto-création des onglets manquants avec les bons en-têtes (Pdfs, Activite, etc.)
//   3. Erreurs explicites quand un onglet ou en-tête est manquant
//   4. Logs Apps Script pour debug (Affichage > Journaux dans l'éditeur)
// =============================================================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const DRIVE_FOLDER_ID = '1DAtlRsujdA8OsrNEHAQ6glacRSVUep2k';
// Dossier dédié aux soumissions Word/Google Docs (séparé des PDF).
const DOCX_FOLDER_ID = '1YqZzKSmRZy1FE5CTC5Wv0sf7r3r8Ar5X';

// Schémas des feuilles — utilisés pour auto-créer les onglets manquants
const SHEET_SCHEMAS = {
  'Soumissions':   ['id','nom','client','adresse','telephone','courriel','statut','dateCreation','dateModif','total','pdfUrl','dataJSON'],
  'Versions':      ['id','soumissionId','dateVersion','label','auteur','dataJSON'],
  'LiensEnvoyes':  ['linkId','soumissionId','dateEnvoi','destinataire','revoque','dateRevocation','derniereOuverture','nbOuvertures'],
  'Envois':        ['id','soumissionId','dateEnvoi','type','destinataire','objet','linkId','statut','notes'],
  'Activite':      ['date','linkId','soumissionId','type','details'],
  'Pdfs':          ['id','soumissionId','dateCreation','nomFichier','pdfUrl','label','trigger'],
  'Docx':          ['id','soumissionId','dateCreation','nomFichier','docUrl','docxUrl','label','trigger'],
};

// REST-style router : action = resource.method
const ROUTES = {
  'soumissions.list':      (ss, p) => list(ss, 'Soumissions'),
  'soumissions.get':       (ss, p) => find(ss, 'Soumissions', 'id', p.id),
  'soumissions.save':      (ss, p) => upsert(ss, 'Soumissions', 'id', p),
  'soumissions.delete':    (ss, p) => remove(ss, 'Soumissions', 'id', p.id),
  'soumissions.setStatus': (ss, p) => patch(ss, 'Soumissions', 'id', p.id, { statut: p.statut, dateModif: new Date().toISOString() }),

  'versions.list':         (ss, p) => list(ss, 'Versions').filter(r => r.soumissionId === p.soumissionId),
  'versions.create':       (ss, p) => append(ss, 'Versions', p),

  'liens.list':            (ss, p) => list(ss, 'LiensEnvoyes'),
  'liens.create':          (ss, p) => append(ss, 'LiensEnvoyes', p),
  'liens.revoke':          (ss, p) => patch(ss, 'LiensEnvoyes', 'linkId', p.linkId, { revoque: 'true', dateRevocation: new Date().toISOString() }),
  'liens.check':           (ss, p) => find(ss, 'LiensEnvoyes', 'linkId', p.linkId),
  'liens.touch':           (ss, p) => touchLink(ss, p.linkId),

  'envois.list':           (ss, p) => list(ss, 'Envois').filter(r => !p.soumissionId || r.soumissionId === p.soumissionId),
  'envois.create':         (ss, p) => append(ss, 'Envois', p),
  'envois.setStatut':      (ss, p) => patch(ss, 'Envois', 'id', p.id, { statut: p.statut }),

  'activite.log':          (ss, p) => append(ss, 'Activite', p),
  'activite.list':         (ss, p) => list(ss, 'Activite'),

  'pdf.upload':            (ss, p) => uploadPdf(ss, p),
  'pdf.list':              (ss, p) => list(ss, 'Pdfs').filter(r => !p.soumissionId || r.soumissionId === p.soumissionId),

  'docx.upload':           (ss, p) => uploadDocx(ss, p),
  'docx.list':             (ss, p) => list(ss, 'Docx').filter(r => !p.soumissionId || r.soumissionId === p.soumissionId),
};

function doGet(e)  { return handle(e); }
function doPost(e) { return handle(e); }

function handle(e) {
  try {
    // ⚠️ Si lancé directement depuis l'éditeur (Exécuter doGet), e est undefined.
    //    Utilise _diagnostic() pour tester depuis l'éditeur.
    e = e || { parameter: {}, postData: null };
    const params = e.parameter || {};

    // ⚠️ PAS de toLowerCase ! Les routes sont sensibles à la casse (setStatus, etc.)
    const action = params.action || '';
    let payload = {};
    if (e.postData && e.postData.contents) {
      try { payload = JSON.parse(e.postData.contents); } catch (err1) {}
    }
    Object.keys(params).forEach(function(k) {
      if (k !== 'action' && payload[k] === undefined) payload[k] = params[k];
    });
    if (params.payload) {
      try { Object.assign(payload, JSON.parse(params.payload)); } catch (err2) {}
    }

    Logger.log('action: ' + action + ' | payload keys: ' + Object.keys(payload).join(','));

    const ss = SpreadsheetApp.openById(SHEET_ID);
    ensureSheets(ss); // auto-crée les onglets manquants

    const route = ROUTES[action];
    if (!route) return json({ ok: false, error: 'unknown action: ' + action }, 404);
    const data = route(ss, payload);
    return json({ ok: true, data });
  } catch (err) {
    Logger.log('ERROR: ' + err.toString() + ' | stack: ' + (err.stack || ''));
    return json({ ok: false, error: err.toString() }, 500);
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Auto-création des onglets manquants avec les en-têtes corrects.
// Si l'onglet existe mais est vide, on écrit les en-têtes.
// On ne touche JAMAIS aux onglets qui ont déjà des en-têtes.
function ensureSheets(ss) {
  Object.keys(SHEET_SCHEMAS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.getRange(1, 1, 1, SHEET_SCHEMAS[name].length).setValues([SHEET_SCHEMAS[name]]);
      sh.setFrozenRows(1);
      Logger.log('Created sheet: ' + name);
    } else if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, SHEET_SCHEMAS[name].length).setValues([SHEET_SCHEMAS[name]]);
      sh.setFrozenRows(1);
      Logger.log('Initialized headers for sheet: ' + name);
    }
  });
}

// ---------- Generic CRUD ----------
function list(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Onglet manquant : ' + name);
  const v = sh.getDataRange().getValues();
  if (v.length < 2) return [];
  const h = v[0];
  return v.slice(1).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}

function find(ss, name, key, val) {
  return list(ss, name).find(r => String(r[key]) === String(val)) || null;
}

function append(ss, name, data) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Onglet manquant : ' + name);
  if (sh.getLastColumn() === 0) throw new Error('Onglet ' + name + ' sans en-têtes');
  const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  if (!data.id && h.includes('id')) data.id = Utilities.getUuid();
  sh.appendRow(h.map(k => data[k] !== undefined ? data[k] : ''));
  return data;
}

function upsert(ss, name, key, data) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Onglet manquant : ' + name);
  const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const v = sh.getDataRange().getValues();
  const ki = h.indexOf(key);
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][ki]) === String(data[key])) {
      sh.getRange(i + 1, 1, 1, h.length).setValues([h.map(k => data[k] !== undefined ? data[k] : v[i][h.indexOf(k)])]);
      return data;
    }
  }
  return append(ss, name, data);
}

function patch(ss, name, key, val, updates) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Onglet manquant : ' + name);
  const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const v = sh.getDataRange().getValues();
  const ki = h.indexOf(key);
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][ki]) === String(val)) {
      Object.keys(updates).forEach(k => {
        const ci = h.indexOf(k);
        if (ci >= 0) sh.getRange(i + 1, ci + 1).setValue(updates[k]);
      });
      return updates;
    }
  }
  return null;
}

function remove(ss, name, key, val) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Onglet manquant : ' + name);
  const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const v = sh.getDataRange().getValues();
  const ki = h.indexOf(key);
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][ki]) === String(val)) { sh.deleteRow(i + 1); return { deleted: val }; }
  }
  return null;
}

function touchLink(ss, linkId) {
  const row = find(ss, 'LiensEnvoyes', 'linkId', linkId);
  if (!row) return null;
  return patch(ss, 'LiensEnvoyes', 'linkId', linkId, {
    derniereOuverture: new Date().toISOString(),
    nbOuvertures: (parseInt(row.nbOuvertures) || 0) + 1,
  });
}

// ---------- PDF upload to Drive ----------
function uploadPdf(ss, p) {
  if (!p.base64) throw new Error('uploadPdf: base64 manquant');

  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const bytes = Utilities.base64Decode(p.base64);
  const blob = Utilities.newBlob(bytes, 'application/pdf', p.nomFichier || 'soumission.pdf');
  const file = folder.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  const url = 'https://drive.google.com/file/d/' + file.getId() + '/view';

  append(ss, 'Pdfs', {
    id: Utilities.getUuid(),
    soumissionId: p.soumissionId || '',
    dateCreation: new Date().toISOString(),
    nomFichier: p.nomFichier || '',
    pdfUrl: url,
    label: p.label || '',
    trigger: p.trigger || 'save',
  });

  if (p.soumissionId) {
    patch(ss, 'Soumissions', 'id', p.soumissionId, { pdfUrl: url });
  }

  return { url, fileId: file.getId() };
}

// ---------- DOCX / Google Doc upload to Drive ----------
// Convertit le HTML imprimable en Google Doc (préserve la mise en page),
// l'enregistre dans DOCX_FOLDER_ID, puis exporte une version .docx dans
// le MÊME dossier. Retourne les deux URLs.
//
// ⚠️ Nécessite l'activation du service avancé "Drive API" :
//    Apps Script Éditeur → Services + → Drive API → Ajouter (identifier: Drive, version v2)
function uploadDocx(ss, p) {
  if (!p.html) throw new Error('uploadDocx: html manquant');
  const baseName = (p.nomFichier || 'Soumission iPropre').replace(/\.(docx?|html?)$/i, '');

  // 1) HTML → Google Doc (conversion native = meilleure fidélité que HTML→DOCX direct)
  const htmlBlob = Utilities.newBlob(p.html, 'text/html', baseName + '.html');
  const docFile = Drive.Files.insert(
    {
      title: baseName,
      parents: [{ id: DOCX_FOLDER_ID }],
      mimeType: 'application/vnd.google-apps.document',
    },
    htmlBlob,
    { convert: true }
  );
  const docUrl = 'https://docs.google.com/document/d/' + docFile.id + '/edit';
  try {
    DriveApp.getFileById(docFile.id).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
  } catch (e) {}

  // 2) Export Google Doc → .docx blob → sauvegarde dans le même dossier
  let docxUrl = '';
  try {
    const exportUrl = 'https://docs.google.com/feeds/download/documents/export/Export?id=' + docFile.id + '&exportFormat=docx';
    const docxBlob = UrlFetchApp.fetch(exportUrl, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true,
    }).getBlob().setName(baseName + '.docx');
    const docxFile = DriveApp.getFolderById(DOCX_FOLDER_ID).createFile(docxBlob);
    try { docxFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
    docxUrl = 'https://drive.google.com/file/d/' + docxFile.getId() + '/view';
  } catch (e) {
    Logger.log('Export .docx échoué : ' + e);
  }

  append(ss, 'Docx', {
    id: Utilities.getUuid(),
    soumissionId: p.soumissionId || '',
    dateCreation: new Date().toISOString(),
    nomFichier: baseName,
    docUrl: docUrl,
    docxUrl: docxUrl,
    label: p.label || '',
    trigger: p.trigger || 'manual',
  });

  return { docUrl, docxUrl, fileId: docFile.id };
}

// ---------- Helper de diagnostic ----------
// Lance cette fonction depuis l'éditeur Apps Script pour vérifier que tout est OK :
//   - les onglets existent
//   - le dossier Drive est accessible
//   - les en-têtes sont corrects
function _diagnostic() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  ensureSheets(ss);

  Logger.log('=== Onglets ===');
  Object.keys(SHEET_SCHEMAS).forEach(name => {
    const sh = ss.getSheetByName(name);
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    Logger.log(name + ' : ' + headers.join(' | ') + ' (' + (sh.getLastRow() - 1) + ' lignes)');
  });

  Logger.log('=== Drive ===');
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    Logger.log('Dossier PDF OK : ' + folder.getName());
  } catch (e) {
    Logger.log('ERREUR Drive PDF : ' + e.toString());
  }
  try {
    const folder = DriveApp.getFolderById(DOCX_FOLDER_ID);
    Logger.log('Dossier DOCX OK : ' + folder.getName());
  } catch (e) {
    Logger.log('ERREUR Drive DOCX : ' + e.toString());
  }
  try {
    Drive.Files.list({ maxResults: 1 });
    Logger.log('Service avancé Drive : activé');
  } catch (e) {
    Logger.log('ERREUR Service avancé Drive : ' + e.toString() + '\n→ Éditeur Apps Script : Services + → Drive API → Ajouter');
  }
}
