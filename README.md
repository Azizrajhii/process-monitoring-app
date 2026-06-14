# Projet de Gestion de Processus

Application full-stack pour la gestion, le suivi et le reporting des processus métiers.

## Architecture

- `back/` : Backend Node.js + Express + MongoDB
- `client/` : Frontend React + TypeScript + Vite

## Fonctionnalités principales

- Authentification et gestion des utilisateurs
- Administration des rôles
- Suivi des processus et versions
- Mesures et indicateurs
- Alertes en temps réel
- Rapports et tableaux de bord

## Prérequis

- Node.js 18+ (ou version compatible)
- npm
- MongoDB en local ou distant

## Installation

### Backend

```bash
cd back
npm install
```

### Frontend

```bash
cd client
npm install
```

## Configuration

### Backend

Créez un fichier `.env` dans `back/` avec au moins :

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/votre_database
JWT_SECRET=uneCleSecrete
```

Ajoutez d'autres variables si nécessaire selon vos besoins.

### Frontend

Créez un fichier `.env` dans `client/` avec :

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Le frontend utilise `http://localhost:5000/api` par défaut si cette variable n'est pas définie.

## Démarrage

### Lancer le backend

```bash
cd back
npm run dev
```

Le backend démarre sur `http://localhost:5000` par défaut.

### Lancer le frontend

```bash
cd client
npm run dev
```

Le frontend Vite démarre généralement sur `http://localhost:5173`.

## Structure du projet

### backend

- `src/app.js` : configuration Express
- `src/server.js` : point d'entrée du serveur
- `src/config/db.js` : connexion à MongoDB
- `src/controllers/` : contrôleurs des routes
- `src/models/` : modèles Mongoose
- `src/routes/` : routes API
- `src/middlewares/` : middlewares Express
- `src/services/` : logique métier et intégrations
- `scripts/` : scripts de seed et utilitaires

### frontend

- `src/main.tsx` : point d'entrée React
- `src/App.tsx` : composant racine
- `src/api/` : client HTTP et appels API
- `src/context/` : contextes React pour l'auth et les notifications
- `src/components/` : composants UI réutilisables
- `src/layouts/` : mises en page principales
- `src/pages/` : pages par rôle et parcours utilisateur
- `src/theme/` : thème et styles

## Notes

- Le backend utilise `nodemon` pour le développement.
- Le frontend utilise Vite avec TypeScript.
- La communication entre le frontend et le backend se fait via Axios et un token Bearer stocké dans `localStorage`.

## Contribution

1. Ouvrir une issue décrivant le problème ou la fonctionnalité.
2. Créer une branche dédiée.
3. Ajouter des tests si nécessaire.
4. Faire une pull request claire avec des explications.

---

Pour plus d'informations, consultez `PROJECT_OVERVIEW.md` et les README dans les dossiers `back/` et `client/` si disponibles.
