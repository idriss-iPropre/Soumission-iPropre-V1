# Correctifs — 11 mai 2026 (suite)

## Fichiers à remplacer sur GitHub

| Fichier | Correctif |
|---|---|
| `envoi.jsx` | PDF auto-téléchargé : styles CSS scopés et injectés temporairement → fini le PDF blanc. Migration `__new__` → ID de soumission au premier enregistrement → le contact saisi avant d'enregistrer reste visible quand on rouvre la soumission. |
| `iPropre-Soumission.html` | Build single-file regénéré. |

`app.jsx` et `soumission.jsx` n'ont **pas** changé depuis la dernière mise à jour.

```bash
git add envoi.jsx iPropre-Soumission.html
git commit -m "Envoi: fix PDF auto (CSS scopé) + migration contact sur premier enregistrement"
git push
```
