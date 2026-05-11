# Mise à jour — DOCX compact, bouton Drive, témoignages dupliqués

## Fichiers à mettre à jour sur GitHub

| Fichier | Changement |
|---|---|
| **`envoi.jsx`** | Le bouton de consultation en ligne du DOCX n'affiche plus l'URL complète — uniquement le bouton orange + mention « version interactive (lecture seule) ». |
| **`app.jsx`** | Bouton « Soumission sur Drive » → **icône-seule** (⬇ + logo Google Drive coloré). Visible **uniquement en session administrateur** (caché en mode client/lien partagé). Suit déjà dans tous les onglets car la barre d'action est globale. |
| **`galerie.jsx`** | Section **« Ce que nos clients disent »** reprise depuis l'onglet Présentation, ajoutée tout en bas de l'onglet Réalisations (sous les vidéos). |

```bash
git add envoi.jsx app.jsx galerie.jsx iPropre-Soumission.html
git commit -m "DOCX lien compact + bouton Drive icône-seule (admin) + témoignages dans Réalisations"
git push
```
