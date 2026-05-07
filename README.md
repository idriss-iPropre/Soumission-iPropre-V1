# iPropre — Application de soumission interactive

Application web (HTML + React + Babel inline) pour préparer, envoyer et suivre les soumissions iPropre.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Point d'entrée — charge tous les modules JSX |
| `app.jsx` | Composant racine, navigation, gestion d'état globale |
| `presentation.jsx` | Page 01 — Présentation |
| `soumission.jsx` | Page 02 — Devis interactif (cœur de l'app) |
| `galerie.jsx` | Page 03 — Galerie photos |
| `annexes.jsx` | Page 04 — Annexes |
| `envoi.jsx` | Page 05 — Envoi du PDF / lien |
| `common.jsx` | Composants partagés (cellules, icônes, etc.) |
| `storage.jsx` | Persistance locale + Google Sheets sync |
| `auth.jsx` | Authentification simple |
| `gsheets.jsx` | Pont Google Sheets |
| `tweaks-panel.jsx` | Panneau de tweaks (mode dev) |
| `iPropre-Soumission.html` | Build single-file (auto-contenu, partageable) |
| `core/` | Modules utilitaires (api, pdf, repo) |
| `assets/` | Images, logos, polices |
| `apps-script-corrige.gs` | Script Google Apps Script (backend Sheets) |

## Mise en ligne

L'app est purement statique : déposez ces fichiers sur n'importe quel hébergeur
(GitHub Pages, Netlify, Cloudflare Pages, Vercel statique, OVH, etc.).
Aucun build ; le navigateur transpile le JSX via Babel.

## Backend Google Sheets

Coller le contenu de `apps-script-corrige.gs` dans un projet Apps Script lié à
votre Google Sheet, puis publier comme application web et coller l'URL dans
l'app (paramètres Google Sheets).
