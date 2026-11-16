# IFCV QUEST V8.0.1 — Recette responsive de la carte

Correction appliquée à `site/index.html`.

## Bug reproduit

Ancienne caméra : `scale = 0.68` en largeur inférieure à 600 px pour une carte de 1 120 px, soit une largeur de 762 px sur un écran de 390 px. Les quartiers de gauche et de droite étaient coupés, les commandes superposées.

## Correctif

- Vue d'ensemble de la ville, cadrage automatique sur la taille disponible.
- Six boutons de quartier toujours visibles, sans défilement horizontal.
- Zoom x2 et retour « Tout voir ».
- Déplacement tactile de la carte zoomée.
- Ajustement après orientation/redimensionnement.
- En-tête compact sur 320 px ; commandes historiques non superposées à la carte en mobile.
- Affichage sur ordinateur inchangé.

## Vérifications Chromium Playwright

7 tailles : 320×568, 360×740, 390×844, 430×932, 768×1024, 844×390 (paysage) et 1440×900.

Pour chaque taille mobile : les 6 boutons existent, aucun débordement horizontal, la carte reste entièrement dans la zone libre, aucun signalement JavaScript. Sur 390 px : zoom et retour, geste de déplacement horizontal réel (transformation caméra modifiée), initiation fictive, accès aux six ateliers : CV, entretien, compétences, mises en situation, métiers et alternance, passeport PDF.

Limites : test sur vrais iPhone et Android restant à réaliser ; PDF.js et validation de la confidentialité hors périmètre de cette correction.
