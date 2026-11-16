# IFCV QUEST V8.0 – version de validation

Projet statique pour aider les candidats IFCV à préparer leurs CV, entretiens et démarches d'alternance. **Prototype pilote : à ne pas diffuser à des candidats réels sans validation SI/RGPD.**

## Fonctionnalités V8

- Bouton **Coach V8** : audit de CV par règles et reformulation à partir des faits saisis.
- Trois entretiens approfondis par diplôme, avec objections et débriefs.
- Une mission à trois étapes et décisions à conséquences.
- Un carnet de prospection d'entreprises et son plan PDF multipage.
- Une fiche de candidature PDF volontairement partageable avec un recruteur.
- Conservation des six ateliers historiques, des douze formations et des quatre modèles IFCV.

## Validation

**131 contrôles automatisés sur 131 réussis** sur le HTML local, dont les 12 parcours et 3 tailles d'écran simulées. Tests sur smartphones physiques, validation pédagogique et RGPD : **non réalisés**.

La lecture et l'annotation du CV PDF original reposent sur PDF.js 4.10.38 et pdf-lib 1.17.1. La publication installe les bibliothèques dans `dist/vendor`. **Leur fonctionnement fonctionnel sur la page publiée doit encore être testé** ; une construction GitHub Actions réussie prouve la présence des fichiers, pas leur bon fonctionnement sur tous les PDF.

## Publication GitHub Pages

1. Dans **Settings > Pages**, choisir **GitHub Actions** comme source.
2. Lors de la demande de fusion V8, GitHub Actions installe les dépendances et contrôle les fichiers publiables, **sans publier la branche de validation**.
3. Une fois la demande fusionnée sur `main`, le workflow construit puis publie la page.
4. Sur le site, ouvrir **Coach V8 > Mon CV > Contrôler les fonctions PDF**.
5. Tester avec des CV fictifs, puis sur téléphones physiques.

Le code métier et les styles V8 sont également isolés sous `SOURCE_V8/` pour faciliter leur maintenance.

**Confidentialité** : aucune donnée de CV ne doit être poussée dans ce dépôt public. Les fichiers téléchargés sur le téléphone peuvent contenir des données personnelles à la demande du candidat ; les personnes utilisant le jeu sont responsables de leur protection. Pas d'automatisation de décision d'admission. Les suggestions d'entreprises ne valent pas offres disponibles.
