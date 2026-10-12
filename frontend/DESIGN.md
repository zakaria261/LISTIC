# LISTIC — Observatoire de la recherche

La nouvelle interface utilise une navigation permanente, une palette ivoire / vert profond, des titres éditoriaux et des visualisations reliées aux données du laboratoire. Les thèmes clair et sombre sont disponibles; le choix est conservé dans `listic-theme-v2`. Aucun téléchargement de police n'est nécessaire.

## Parcours

| Route                   | Vue                                                                             |
| ----------------------- | ------------------------------------------------------------------------------- |
| `/`                     | Vue d'ensemble : collectif, indicateurs locaux, courbe annuelle, accès à Oracle |
| `/researchers`          | Annuaire : recherche, catégories, tri, grille/liste, pagination et exports      |
| `/researcher/:id`       | Profil scientifique, filtres, publications et collaborations                    |
| `/projects`             | Portefeuille de projets et filtres                                              |
| `/projects?project=:id` | Fiche détaillée d'un projet, lien directement partageable                       |
| `/network`              | Atlas interactif, recherche de nœuds, sélection et exploration 3D               |
| `/global-stats`         | Statistiques HAL en direct, période, facettes et exports                        |
| `/advanced`             | Analyses, collaborations, anomalies, clustering, sources et chronologie         |

L'ancien annuaire situé à la racine est maintenant accessible sous `/researchers`.

## Organisation

- `context/LaboratoryProvider.jsx` centralise les lectures des données locales, gère les annulations, les erreurs partielles et l'actualisation.
- `components/WorkspaceUI.jsx` contient les titres, indicateurs et états communs.
- Les variables de `src/index.css` définissent les couleurs et les surfaces des deux thèmes. Les styles `analysis-view` harmonisent les visualisations détaillées conservées.
- Les vues d'analyse sont chargées à la demande. Oracle conserve son endpoint et son connecteur Gemini.
- Les nombres sont lus dans les API; aucune donnée de démonstration n'est utilisée. Les comptages de l'entrepôt local et les facettes HAL en direct ont des périmètres différents, précisés dans l'interface.

## Vérification

Depuis `frontend`, exécuter `npm run build`. Lancer le serveur avec `npm run dev`; MongoDB et l'API doivent également fonctionner selon les instructions d'environnement.

Les contrôles navigateur couvrent la recherche sourcée avec Oracle, les filtres, le tri, la pagination, les exports téléchargés, les fiches, les projets, le développement du graphe, la validation des périodes, les onglets d'analyse, la chronologie, les thèmes persistants et la navigation mobile. Les vues ont été inspectées sur ordinateur et à 390 et 320 pixels de largeur.

La recherche locale fonctionne sans clé Gemini. Une synthèse IA nécessite toujours `GEMINI_API_KEY` côté backend; voir `backend/ORACLE.md`.
