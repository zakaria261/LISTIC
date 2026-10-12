# Oracle LISTIC — première version

L'Oracle existant appelle désormais `POST /api/oracle` avec
`{"question":"Quels chercheurs sont associés à l'IA explicable ?"}`.
Il interroge la base locale, cite les sources et affiche le périmètre du corpus.

## Gemini

Injecter `GEMINI_API_KEY` dans le processus backend via les paramètres sécurisés
de l'environnement. Ne jamais placer la clé dans le frontend ou dans Git.
`GEMINI_MODEL` est facultatif et vaut `gemini-2.5-flash` par défaut.
Le fichier `.env.example` documente les noms; le backend ne charge pas
automatiquement les fichiers `.env`. Redémarrer le backend après injection.
Autoriser `generativelanguage.googleapis.com` dans les règles réseau.

Le connecteur utilise l'API Chat Completions compatible OpenAI de Gemini,
avec `httpx`, sans dépendance supplémentaire. Jusqu'à deux tours d'outils
(trois appels par tour maximum), puis une réponse JSON avec citations.
Le modèle peut consulter uniquement `search_researchers`, `search_publications`
et `get_statistics`. Ces outils ne modifient aucune donnée et ne visitent aucun
site. Une clé absente, une erreur fournisseur ou des références invalides
activent la recherche locale, explicitement affichée sans synthèse IA.

## Sources et limites

- Profils LISTIC, sujets de thèse, titres, mots-clés et résumés des publications.
- Déduplication par identifiant HAL entre l'entrepôt et les publications
  déjà présentes dans les fiches des doctorants; provenance affichée.
- Les profils sont associés aux thèmes par leurs publications ou leur
  encadrement renseigné. L'encadrement n'établit pas une co-signature.
- Comptages exacts de la base et comptages du corpus filtré séparés.
- Index limité à 1 000 profils, 1 000 doctorants et les 10 000 publications
  les plus récentes de l'entrepôt; un avertissement signale une troncature.
- Recherche lexicale avec un petit vocabulaire français/anglais. La recherche
  par embeddings et la recommandation de collaborations sont des extensions.
- Les coordonnées des profils ne sont pas envoyées au modèle. La question et
  les extraits scientifiques sélectionnés sont transmis à Google.
- Les citations sont vérifiées contre les sources réellement consultées.
  Cette vérification ne garantit pas que toute interprétation du modèle soit
  correcte: les sources restent consultables pour vérifier les affirmations.
- Pas d'historique conversationnel pour cette première version.

## Validation

Depuis `backend` :

```bash
../.venv/bin/python -m unittest discover -s tests -v
```

Depuis `frontend` :

```bash
npm run build
./node_modules/.bin/eslint src/components/OracleOmnibar.jsx
```

Les tests du connecteur utilisent un fournisseur simulé: ils valident les
outils, les citations et le repli, sans prouver l'accès réel à Gemini.
Avec une clé valide, envoyer une question via l'Oracle et vérifier
`mode: "gemini"`, les références et les comptages. Un résultat `mode: "local"`
signifie que la génération Gemini n'a pas été validée.
