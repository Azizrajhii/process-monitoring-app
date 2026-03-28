# Glossaire des termes techniques qualité

## SPC Chart (Statistical Process Control Chart)
Un graphique SPC (contrôle statistique des procédés) est un outil visuel utilisé pour surveiller la stabilité et la performance d’un processus industriel ou de mesure. Il affiche les valeurs mesurées dans le temps, la moyenne, et les limites de contrôle (LSL/USL). Il permet de détecter rapidement les dérives, anomalies ou variations inhabituelles.

## Cp (Indice de Capabilité du Processus)
- **Définition** : Cp mesure la capacité d’un processus à produire dans les tolérances spécifiées, sans tenir compte de la position de la moyenne.
- **Formule** : Cp = (USL - LSL) / (6 × écart-type)
- **Interprétation** :
  - Cp > 1 : Le processus est potentiellement capable.
  - Cp < 1 : Le processus n’est pas capable de respecter les tolérances.

## Cpk (Indice de Capabilité Centrée)
- **Définition** : Cpk mesure la capacité du processus à produire dans les tolérances, en tenant compte du centrage de la moyenne par rapport aux limites.
- **Formule** : Cpk = min[(USL - moyenne) / (3 × écart-type), (moyenne - LSL) / (3 × écart-type)]
- **Interprétation** :
  - Cpk > 1 : Le processus est capable et bien centré.
  - Cpk < 1 : Le processus n’est pas capable ou mal centré.

## LSL (Lower Specification Limit)
- **Définition** : Limite de spécification inférieure. C’est la valeur minimale acceptable pour une mesure ou un paramètre.
- **Exemple** : Si LSL = 10, toute valeur < 10 est considérée hors spécification.

## USL (Upper Specification Limit)
- **Définition** : Limite de spécification supérieure. C’est la valeur maximale acceptable pour une mesure ou un paramètre.
- **Exemple** : Si USL = 20, toute valeur > 20 est considérée hors spécification.

## Moyenne (Mean)
La moyenne arithmétique des valeurs mesurées. Elle donne une idée de la tendance centrale du processus.

## Ecart-type (Standard Deviation)
Mesure la dispersion des valeurs autour de la moyenne. Un faible écart-type indique un processus stable.

## Sample Size (Taille d’échantillon)
Nombre de mesures prises en compte pour le calcul des statistiques.

## Alertes intelligentes
Notifications générées automatiquement lorsqu’une anomalie est détectée :
- **Cpk bas** : Processus non capable.
- **Limite dépassée (LSL/USL)** : Valeur hors spécification.
- **Tendance anormale** : Variation inhabituelle détectée dans le temps.

---

Ce glossaire permet à tout utilisateur de comprendre les indicateurs et graphiques affichés dans les dashboards et rapports qualité du projet.
