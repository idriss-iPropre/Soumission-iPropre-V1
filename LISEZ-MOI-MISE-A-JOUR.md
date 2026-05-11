# Mise à jour — 11 mai 2026

## Fichiers à remplacer sur GitHub

| Fichier | Pourquoi |
|---|---|
| `envoi.jsx` | Nouveaux boutons (Courriel + lien formulaire / lecture seule), PDF auto-téléchargé via html2pdf, formulaire par soumission, raccourcisseur de lien avec fallback v.gd |
| `app.jsx` | Effacer le formulaire Envoi sur "Nouvelle soumission" + lecture du formulaire par ID de soumission |
| `soumission.jsx` | Modèles de soumission, undo/redo compacts |
| `iPropre-Soumission.html` | Build single-file mis à jour (regénéré) |

## Comment commiter

```bash
# Dans votre repo local
cp envoi.jsx app.jsx soumission.jsx iPropre-Soumission.html /chemin/vers/votre/repo/

cd /chemin/vers/votre/repo
git add envoi.jsx app.jsx soumission.jsx iPropre-Soumission.html
git commit -m "Envoi: 2 boutons mailto (formulaire/lecture seule), PDF auto-téléchargé, formulaire par soumission"
git push
```

Aucun autre fichier n'a besoin d'être modifié.
