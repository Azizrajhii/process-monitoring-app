# Rôles utilisateurs et accès aux pages

## Rôles disponibles
- **Manager** : Supervise l'ensemble des processus, utilisateurs et statistiques. Peut gérer les utilisateurs, consulter tous les dashboards, rapports et alertes.
- **Qualité** : Se concentre sur la validation des mesures, la capabilité des processus, la gestion des alertes qualité et la génération de rapports détaillés.
- **Opérateur** : Saisie et suivi des mesures, consultation des alertes et du statut des processus auxquels il est affecté. Peut voir son profil et l'historique de ses actions.

---

## Accès et actions par rôle

| Page / Fonctionnalité         | Manager | Qualité | Opérateur |
|------------------------------|:-------:|:-------:|:---------:|
| Dashboard Manager            |   ✔️    |         |           |
| Dashboard Qualité            |   ✔️    |   ✔️    |           |
| Dashboard Opérateur          |   ✔️    |         |    ✔️     |
| Gestion des utilisateurs     |   ✔️    |         |           |
| Gestion des processus        |   ✔️    |         |           |
| Validation qualité           |   ✔️    |   ✔️    |           |
| Rapports qualité             |   ✔️    |   ✔️    |           |
| Alertes qualité              |   ✔️    |   ✔️    |           |
| Alertes opérateur            |   ✔️    |         |    ✔️     |
| Mesures opérateur            |   ✔️    |         |    ✔️     |
| Profil utilisateur           |   ✔️    |   ✔️    |    ✔️     |
| Audit trail (historique)     |   ✔️    |   ✔️    |    ✔️     |

---

## Contenu et explication des dashboards et rapports

### Dashboard Manager
- **Vue d'ensemble** : Nombre de processus actifs, taux de processus non capables, top 5 des processus à risque (Cpk faible).
- **Graphique d'évolution Cpk** : Suivi sur 7 jours de la capabilité des processus.
- **But** : Permet au manager d'identifier rapidement les points faibles et d'agir sur les processus à risque.

### Dashboard Qualité
- **Vue synthétique** : Nombre de processus actifs, alertes ouvertes, statistiques de capabilité (Cp, Cpk).
- **Graphiques** : Evolution des mesures, suivi des alertes, analyse de la performance qualité.
- **But** : Suivre la conformité et la performance des processus du point de vue qualité.

### Dashboard Opérateur
- **Vue personnalisée** : Affiche les mesures récentes, alertes et statut des processus affectés à l'opérateur.
- **But** : Permet à l'opérateur de suivre ses tâches, voir les anomalies et agir rapidement.

### Rapports Qualité
- **Sélection du processus et période** : L'utilisateur choisit un processus et une période (semaine, mois, trimestre).
- **Statistiques** : Taille de l'échantillon, moyenne, écart-type, Cp, Cpk.
- **Conclusion** : Statut de capabilité (capable/non capable/insuffisant), message explicatif.
- **Graphiques** :
  - **SPC Chart (X-bar)** : Contrôle statistique du processus avec limites LSL/USL et moyenne.
  - **Historique Cp/Cpk** : Evolution temporelle de la capabilité.
- **Alertes intelligentes** : Liste des anomalies détectées (Cpk bas, limites dépassées, tendances anormales).
- **Export** : Possibilité d’exporter le rapport en CSV ou PDF.

---

## Exemple de parcours utilisateur
- **Manager** : Se connecte, consulte le dashboard manager, analyse les alertes, gère les utilisateurs et les processus, exporte des rapports globaux.
- **Qualité** : Valide les mesures, surveille les alertes qualité, génère et exporte des rapports détaillés, suit la capabilité des processus.
- **Opérateur** : Saisit des mesures, consulte ses alertes, vérifie le statut de ses processus, met à jour son profil.

---

Chaque page est conçue pour répondre aux besoins spécifiques de chaque rôle, avec des dashboards et rapports adaptés pour une prise de décision rapide et efficace.
