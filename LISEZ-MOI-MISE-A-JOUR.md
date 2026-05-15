# Mise à jour — vue mobile & tablette optimisée

Refonte complète de la responsive — tous les onglets sont maintenant utilisables sur téléphone (375 px) et tablette.

## Fichiers à mettre à jour sur GitHub

| Fichier | Changement |
|---|---|
| `index.html` | Nouveau bloc CSS responsive : 3 breakpoints (≤900, ≤720, ≤420), tailles de typo réduites, hero Présentation compacté, stats en 2 colonnes sur mobile, plan-head Soumission 3 colonnes lisibles, pastille contact déplacée en bas et icônes-seule sur petit écran, banner client mode compact. |
| `presentation.jsx` | Ajout des hooks de classe : `presentation-hero`, `services-grid`, `stats-grid`, `stats-aside`, `stats-header`, `stats-two-col`, `testimonial-grid`, `clients-grid`, `big-num`. |
| `galerie.jsx` | Hooks de classe `galerie-grid`, `video-grid`. |
| `common.jsx` | Pastille contact : classes `contact-pill`, `contact-pill-text`, `contact-pill-icon-main` pour CSS responsive. |
| `app.jsx` | Bannière mode client : classe `client-banner`. |
| `iPropre-Soumission.html` | Bundle regénéré. |

## Comportement mobile

- **Présentation** : hero stack vertical, h1 ne se coupe plus mot-par-mot, stats en 2×3, "5% & 0%" plus compact
- **Soumission** : les 3 colonnes (Devis initial / Offre iPropre / VIP) restent visibles avec typo réduite + pastille « CHOISI » cachée pour gagner de l'espace
- **Pastille contact** : se déplace en bas à droite (au-dessus de la barre d'action), icônes-seule pour ne pas masquer le contenu
- **Bannière client mode** : padding réduit, ne mange plus la moitié de l'écran
- **Action bar** : 2 rangées (info + boutons), prend toute la largeur

```bash
git add index.html common.jsx presentation.jsx galerie.jsx app.jsx iPropre-Soumission.html
git commit -m "Mobile/tablette: refonte responsive complète sur tous les onglets"
git push
```
