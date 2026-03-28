# Project Overview

## Introduction
This project is a full-stack web application designed to manage, monitor, and report on various business processes. It consists of two main parts:
- **Backend**: Node.js/Express REST API
- **Frontend**: React (with TypeScript) single-page application

---

## Backend (`back/`)
- **Purpose**: Provides RESTful APIs for authentication, user management, process monitoring, alerting, reporting, and more.
- **Key Technologies**: Node.js, Express, MongoDB (via Mongoose)
- **Structure**:
  - `src/`
    - `controllers/`: Handle HTTP requests for different resources (alerts, auth, dashboard, measurements, processes, reports).
    - `models/`: Mongoose models for MongoDB collections (User, Process, Measurement, etc.).
    - `middlewares/`: Express middlewares for authentication, error handling, etc.
    - `routes/`: API route definitions, grouped by resource.
    - `services/`: Business logic and integrations (email, real-time notifications, etc.).
    - `config/`: Database configuration.
    - `app.js` & `server.js`: App entry points.
  - `scripts/`: Utility scripts for seeding and managing data.

---

## Frontend (`client/`)
- **Purpose**: User interface for interacting with the backend services.
- **Key Technologies**: React, TypeScript, Vite
- **Structure**:
  - `src/`
    - `components/`: Reusable UI components (navigation, forms, admin panels, etc.).
    - `app/`: Application routes.
    - `context/`: React context providers (authentication, notifications).
    - `api/`: HTTP client and API wrappers.
    - `layouts/`: Page layouts (dashboard, public, etc.).
    - `pages/`: Page-level components for different user roles (manager, operator, quality, public, etc.).
    - `theme/`: Theme and style customizations.
    - `utils/`: Utility functions.
  - `index.html`: Main HTML entry point.
  - `vite.config.*`: Vite configuration files.

---

## Main Features
- **Authentication**: Secure login, signup, password reset.
- **User Management**: Admin panel for managing users and roles.
- **Process Monitoring**: Track and manage business processes and their versions.
- **Alerts & Notifications**: Real-time alerts for important events.
- **Reporting**: Generate and view reports on processes and measurements.
- **Dashboard**: Visual overview of key metrics and statuses.

---

## Usage
- **Backend**: Run with Node.js, connects to MongoDB.
- **Frontend**: Run with Vite, communicates with backend via REST API.

---

## Who is it for?
This project is intended for organizations needing to monitor, manage, and report on operational processes, with role-based access and real-time capabilities.

---

## Getting Started
1. Install dependencies in both `back/` and `client/` folders.
2. Configure environment variables (database, API URLs, etc.).
3. Start backend and frontend servers.

---

## Documentation
- See `README.md` files in both `back/` and `client/` for setup and usage details.
- `MANAGER_GUIDE.md` provides additional guidance for managers.
