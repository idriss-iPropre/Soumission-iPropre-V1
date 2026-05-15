# Mise à jour — comportement pastille contact uniforme

| Fichier | Changement |
|---|---|
| `common.jsx` | Pastille : masquage au scroll-vers-le-bas et ré-apparition au scroll-vers-le-haut, sur **tous** les onglets. Tant qu'on est près du haut (<60px), la pastille reste visible. |
| `app.jsx` | Changement d'onglet → la page scroll vers le haut automatiquement → la pastille glisse à nouveau. |
| `iPropre-Soumission.html` | Bundle regénéré. |

```bash
git add common.jsx app.jsx iPropre-Soumission.html
git commit -m "Pastille contact: comportement uniforme sur tous les onglets"
git push
```
