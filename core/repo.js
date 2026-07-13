// core/repo.js — REST-style repositories. Pure data layer: no UI here.
// Each export is a small object that mirrors a REST resource on the backend.
// Migrating to Node later means swapping window.api.call() — these signatures stay.

(function () {
  const api = window.api;
  if (!api) { console.error('core/repo.js: window.api missing — load core/api.js first'); return; }

  function uuid() {
    return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function now() { return new Date().toISOString(); }

  // ---------- Soumissions ----------
  const Soumissions = {
    async list() { return api.call('soumissions.list'); },
    async get(id) { return api.call('soumissions.get', { id }); },
    async save(soumission) {
      const payload = { ...soumission };
      if (!payload.id) payload.id = uuid();
      if (!payload.dateCreation) payload.dateCreation = now();
      payload.dateModif = now();
      // Always serialize the full snapshot to dataJSON for fidelity
      if (payload.data && typeof payload.data === 'object') {
        payload.dataJSON = JSON.stringify(payload.data);
        delete payload.data;
      }
      return api.call('soumissions.save', payload);
    },
    async delete(id) { return api.call('soumissions.delete', { id }); },
    async setStatus(id, statut) { return api.call('soumissions.setStatus', { id, statut }); },
  };

  // ---------- Versions (historique) ----------
  const Versions = {
    async list(soumissionId) { return api.call('versions.list', { soumissionId }); },
    async create({ soumissionId, label, auteur, data }) {
      return api.call('versions.create', {
        id: uuid(),
        soumissionId,
        dateVersion: now(),
        label: label || '',
        auteur: auteur || '',
        dataJSON: typeof data === 'string' ? data : JSON.stringify(data || {}),
      });
    },
  };

  // ---------- Liens envoyés ----------
  const Liens = {
    async list() { return api.call('liens.list'); },
    async create({ linkId, soumissionId, destinataire }) {
      return api.call('liens.create', {
        linkId,
        soumissionId,
        dateEnvoi: now(),
        destinataire: destinataire || '',
        revoque: 'false',
        dateRevocation: '',
        derniereOuverture: '',
        nbOuvertures: 0,
      });
    },
    async revoke(linkId) { return api.call('liens.revoke', { linkId }); },
    async check(linkId) { return api.call('liens.check', { linkId }); },
    async touch(linkId) { return api.silent('liens.touch', { linkId }); }, // silent ping
  };

  // ---------- Envois (suivi courriel) ----------
  // type: "premier" | "relance" | "modification" | "client_response"
  // statut: "envoye" | "ouvert" | "repondu" | "concretise" | "abandonne"
  const Envois = {
    async list(soumissionId) { return api.call('envois.list', soumissionId ? { soumissionId } : {}); },
    async create({ soumissionId, type, destinataire, objet, linkId, notes }) {
      return api.call('envois.create', {
        id: uuid(),
        soumissionId,
        dateEnvoi: now(),
        type: type || 'premier',
        destinataire: destinataire || '',
        objet: objet || '',
        linkId: linkId || '',
        statut: 'envoye',
        notes: notes || '',
      });
    },
    async setStatut(id, statut) { return api.call('envois.setStatut', { id, statut }); },
  };

  // ---------- Activité (log technique) ----------
  const Activite = {
    async log({ linkId, soumissionId, type, details }) {
      return api.silent('activite.log', {
        date: now(),
        linkId: linkId || '',
        soumissionId: soumissionId || '',
        type: type || '',
        details: typeof details === 'string' ? details : JSON.stringify(details || {}),
      });
    },
    async list() { return api.call('activite.list'); },
  };

  // ---------- PDFs (Drive uploads) ----------
  // base64 = PDF bytes (no data: prefix). Apps Script writes to the configured
  // Drive folder, sets share=anyone-with-link, logs into Pdfs tab, and updates
  // the parent soumission's pdfUrl column.
  const Pdfs = {
    async upload({ soumissionId, base64, nomFichier, label, trigger }) {
      return api.call('pdf.upload', {
        soumissionId: soumissionId || '',
        base64: base64 || '',
        nomFichier: nomFichier || 'soumission.pdf',
        label: label || '',
        trigger: trigger || 'save', // 'save' | 'send'
      });
    },
    async list(soumissionId) { return api.call('pdf.list', soumissionId ? { soumissionId } : {}); },
  };

  // ---------- DOCX / Google Doc (Drive uploads) ----------
  // Sends the printable HTML; Apps Script converts to Google Doc (preserves
  // layout much better than client-side .doc) and exports a .docx in the same
  // Drive folder. Returns { docUrl, docxUrl, fileId }.
  const Docx = {
    async upload({ soumissionId, html, nomFichier, label, trigger }) {
      return api.call('docx.upload', {
        soumissionId: soumissionId || '',
        html: html || '',
        nomFichier: nomFichier || 'Soumission iPropre',
        label: label || '',
        trigger: trigger || 'manual',
      });
    },
    async list(soumissionId) { return api.call('docx.list', soumissionId ? { soumissionId } : {}); },
  };

  // ---------- Contacts (annuaire client, synchronisé multi-appareils) ----------
  const Contacts = {
    async list() { return api.call('contacts.list'); },
    async save(contact) {
      const payload = { ...contact };
      if (!payload.id) payload.id = uuid();
      payload.updatedAt = now();
      return api.call('contacts.save', payload);
    },
    async delete(id) { return api.call('contacts.delete', { id }); },
  };

  // ---------- ShortLinks (lien court interne stocké côté serveur) ----------
  // Stocke l'état d'une soumission encodé (LZ-string compressé) sous un
  // shortId aléatoire de 5 caractères. Le client reçoit une URL ultra-courte
  // genre `?mode=client&s=iP9k2` qui pointe directement vers l'app.
  const ShortLinks = {
    async create({ soumissionId, clientName, editable, dataJSON, linkId }) {
      return api.call('shortlinks.create', {
        soumissionId: soumissionId || '',
        clientName: clientName || '',
        editable: !!editable,
        dataJSON: dataJSON || '',
        linkId: linkId || '',
      });
    },
    async resolve(shortId) { return api.call('shortlinks.resolve', { shortId }); },
  };

  // ---------- URL shortener (server-side proxy via Apps Script) ----------
  // Apps Script calls is.gd / v.gd / tinyurl from the server, bypassing the
  // CORS blocks that affect direct browser calls. Returns { shortUrl, service }.
  const Shortener = {
    async shorten(longUrl) {
      return api.call('shorten.url', { url: longUrl });
    },
  };

  // ---------- OCR (carte de visite → texte, via Drive API ocr=true) ----------
  // Envoie la photo en base64 ; Apps Script la convertit en Google Doc OCR,
  // lit le texte, supprime le fichier temporaire et renvoie { text }.
  const Ocr = {
    async card({ base64, mimeType, lang }) {
      return api.call('ocr.card', {
        base64: base64 || '',
        mimeType: mimeType || 'image/jpeg',
        lang: lang || 'fr',
      });
    },
  };

  window.repo = { Soumissions, Versions, Liens, Envois, Activite, Pdfs, Docx, Contacts, ShortLinks, Shortener, Ocr, uuid, now };
})();
