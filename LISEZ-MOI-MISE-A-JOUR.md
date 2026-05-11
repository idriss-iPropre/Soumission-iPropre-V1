# Mise à jour — Soumission Word directement sur Google Drive

Le bouton **Soumission sur Drive (Word)** envoie maintenant le HTML imprimable à Apps Script, qui crée un **Google Doc** dans votre dossier Drive (mise en page préservée !) puis exporte aussi une copie **.docx** dans le même dossier. L'app ouvre le Google Doc dans un nouvel onglet — vous pouvez l'éditer en ligne ou faire `Fichier > Télécharger > .docx`.

## ⚠️ Étape Apps Script à faire UNE FOIS

1. Ouvrir votre projet Apps Script lié à la feuille Google Sheets
2. Coller le contenu de `apps-script-corrige.gs`
3. **Activer le service avancé Drive API** :
   - Dans l'éditeur Apps Script, panneau de gauche → **Services** → **+**
   - Choisir **Drive API**, identifier `Drive`, version `v2` → **Ajouter**
4. **Enregistrer** et **Déployer → Gérer les déploiements → modifier → Nouvelle version**
5. Lancer la fonction `_diagnostic` une fois pour vérifier que les deux dossiers Drive et le service Drive sont OK (voir Journaux)

Le dossier `1YqZzKSmRZy1FE5CTC5Wv0sf7r3r8Ar5X` (que vous avez fourni) est déjà codé dans la constante `DOCX_FOLDER_ID`.

## Fichiers à remplacer sur GitHub

| Fichier | Changement |
|---|---|
| `apps-script-corrige.gs` | Nouvelle action `docx.upload` + nouvel onglet `Docx` + nouveau dossier `DOCX_FOLDER_ID` + diagnostic étendu |
| `core/repo.js` | Ajout de `window.repo.Docx` |
| `app.jsx` | Le bouton appelle maintenant Apps Script au lieu de générer un .doc local |
| `iPropre-Soumission.html` | Build single-file regénéré |

```bash
git add app.jsx core/repo.js apps-script-corrige.gs iPropre-Soumission.html
git commit -m "Soumission Word: conversion via Apps Script + Google Docs (mise en page préservée)"
git push
```
