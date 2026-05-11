# Word compact — logo + lien consultation cliquable

## Fichiers à mettre à jour sur GitHub

| Fichier | Changement |
|---|---|
| **`logo-data.js`** *(NOUVEAU)* | Logo iPropre encodé en base64 (5 KB, 63×90 px). Permet d'embarquer le logo dans le HTML du DOCX sans dépendre d'un chemin externe. |
| **`index.html`** | Ajout du `<script src="logo-data.js">` avant `envoi.jsx`. |
| **`envoi.jsx`** | `buildCompactDocxHtml` accepte un nouveau paramètre `shortUrl` ; affiche le logo dans l'en-tête + un **bouton orange « 🔗 Consulter la soumission en ligne »** cliquable juste sous l'en-tête. |
| **`app.jsx`** | `handleQuickDocx` est maintenant `async` : il **génère et raccourcit le lien client AVANT** la conversion Word, puis le passe à `buildCompactDocxHtml`. Le lien embarqué est le lien court (is.gd / v.gd), avec fallback sur le lien long. |

## Comportement

- Bouton **« Soumission sur Drive (Word) »** : 
  1. Raccourcit le lien client (is.gd → v.gd → long URL fallback)
  2. Construit le HTML compact avec logo + bouton de consultation
  3. Upload sur Drive (Google Docs + .docx)
  4. Le client ouvre le Word et clique sur le bouton orange pour consulter la version interactive en mode lecture
- Le lien court apparaît aussi en texte à côté du bouton (utile en impression papier)

```bash
git add envoi.jsx app.jsx index.html logo-data.js iPropre-Soumission.html
git commit -m "DOCX: logo + bouton consultation en ligne cliquable"
git push
```
