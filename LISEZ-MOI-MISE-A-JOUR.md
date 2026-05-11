# Ajout — bouton « Soumission en Word »

## Fichiers à remplacer sur GitHub

| Fichier | Changement |
|---|---|
| `app.jsx` | Nouveau bouton **Soumission en Word** à côté de **Offre en PDF** dans la barre d'action. Génère un fichier `.doc` (HTML enrichi) compatible avec Microsoft Word ET Google Docs (clic droit → Ouvrir avec → Google Docs). |
| `iPropre-Soumission.html` | Build single-file regénéré. |

```bash
git add app.jsx iPropre-Soumission.html
git commit -m "Ajout bouton Soumission en Word (.doc compatible Google Docs)"
git push
```
