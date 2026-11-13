# IFCV QUEST — prêt pour GitHub Pages

**Version du jeu : 7.6.1.** Projet statique HTML/JavaScript ; pas de compte candidat ni de base de données serveur.

## Mise en ligne rapide (interface GitHub)

1. Décompresser le ZIP et ouvrir le dossier `IFCV_QUEST_GITHUB_PAGES_V7_6_1`.
2. Sur https://github.com/new, créer un dépôt **public** nommé `ifcv-quest` (ou un autre nom) ; laisser la branche principale sur `main`.
3. Dans ce dépôt, choisir **Add file → Upload files**. Glisser **le contenu du dossier décompressé**, pas le ZIP lui-même. IMPORTANT : inclure le dossier caché `.github/workflows/` ; vérifier sa présence dans le dépôt après l’envoi. Valider le commit sur `main`.
4. Dans **Settings → Pages**, choisir **Source : GitHub Actions** (et non Deploy from a branch).
5. Ouvrir l’onglet **Actions**, puis le workflow **Publication IFCV QUEST**. Son exécution automatique peut précéder l’activation de Pages ; si besoin, cliquer **Run workflow** (branche `main`). Attendre un statut vert.
6. Dans **Settings → Pages**, ouvrir **Visit site**. L’adresse sera du type `https://VOTRE_COMPTE.github.io/ifcv-quest/`. Elle fonctionne sur iPhone, Android et ordinateur. Partager le lien ou son QR code.

Le déploiement télécharge automatiquement les versions **PDF.js 4.10.38** et **pdf-lib 1.17.1** pendant le workflow et les met dans `vendor/`. Les CV ne sont pas envoyés à npm ni à GitHub Actions : seuls les scripts sont téléchargés lors de la publication. Après publication, les bibliothèques sont chargées depuis votre site GitHub Pages.

## Si tu ne vois pas le dossier `.github`

Sous macOS, les dossiers dont le nom commence par `.` sont cachés dans le Finder. Presse `⌘` + `⇧` + `.` pour les afficher, puis ajoute les fichiers ou le dossier. Sans le workflow, l’installation automatique de PDF.js ne se fera pas.

## Sur téléphone

Ouvrir l'URL HTTPS dans Safari/Chrome. Sur iPhone, utiliser Partager → **Sur l’écran d’accueil** ; sur Android, menu du navigateur → **Ajouter à l’écran d’accueil** / **Installer l’application** (selon navigateur). Ce sont des raccourcis vers le site ; une connexion peut rester nécessaire.

## Comment conserver la progression ?

Dans le jeu, choisir **« Mon jeu »** en haut de l’écran et télécharger le HTML avec la progression, ou enregistrer le fichier JSON. **Pour conserver les fonctions avancées PDF après reprise, rouvrir le site en ligne et importer la sauvegarde JSON** : le HTML de sauvegarde téléchargé localement ne transporte pas le dossier `vendor/`.

## Précautions importantes

- **GitHub Pages est public** sur un dépôt GitHub Free public : code et contenus du dépôt sont visibles. Ne jamais déposer de CV réels, données personnelles, sauvegardes ou documents internes non destinés à être publics dans le dépôt.
- Les CV importés sont traités dans le navigateur lors des fonctions prévues ; le jeu n’enregistre pas automatiquement de CV sur GitHub. L'activation manuelle du mode « bibliothèques en ligne » peut charger du code tiers ; elle n'est pas nécessaire avec le déploiement ci-dessus.
- Projet pilote : **ne pas utiliser avec de vrais candidats avant** validation informatique/RGPD, revue des traitements de données et tests sur appareils physiques.
- Les diagnostics de CV et tests d'intérêts ne sont pas des évaluations psychométriques validées et ne doivent pas servir à automatiser une admission.
- Les bibliothèques PDF.js et pdf-lib sont gratuites et sous licences Apache 2.0 et MIT respectivement. Les licences sont copiées dans `vendor/` lorsqu'elles sont disponibles dans les distributions npm.

## Si le déploiement échoue

Dans **Actions**, cliquer le workflow en échec puis **construire** et ouvrir la première étape rouge. S’assurer que **Settings → Pages → Source : GitHub Actions** est sélectionné et que `.github/workflows/publier-github-pages.yml` est présent. Les versions de bibliothèques PDF sont fixes ; si npm refuse d'accéder au registre, relancer le workflow plus tard ou vérifier les restrictions réseau de votre organisation.

## Contenu du dépôt

- `site/index.html` : IFCV QUEST V7.6.1 ; aucun CV personnel embarqué.
- `site/assets/favicon.svg`, `site/manifest.webmanifest`, `site/.nojekyll` : identité et affichage mobile.
- `.github/workflows/publier-github-pages.yml` : publication automatique.
- `package.json`, `scripts/build-site.mjs` : récupération et copie des bibliothèques PDF.

[Documentation officielle GitHub Pages](https://docs.github.com/fr/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
