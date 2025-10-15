# Smart Task Manager

A small app that uses a chat UI + AI to generate actionable task plans and export them to PDF.

This README explains how to run the project locally after cloning from GitHub on Windows (PowerShell).

## Prerequisites

- Node.js (>= 18 recommended)
- npm (comes with Node.js)
- A MongoDB instance (Atlas or local)

## Repository layout

- `frontend/` — Vite + React + TypeScript frontend
- `backend/` — Express + TypeScript + Mongoose backend

## Quick start (clone & run)

Open PowerShell and run:

```powershell
# Clone the repo
git clone <YOUR_REPO_URL>
cd smartTaskManager

# Install dependencies for frontend and backend
cd frontend
npm install

cd ..\backend
npm install
```

## Environment variables

This project uses environment variables for sensitive configuration. Two example files are provided:

- `backend/.env.example`
- `frontend/.env.example`

You should copy these to `.env` (or `.env.local`) and fill in real values. Do not commit real secrets to Git.

Example (PowerShell):

```powershell
# Backend
cd backend
cp .env.example .env
# Edit .env and set MONGO_URI and JWT_SECRET

# Frontend
cd ..\frontend
cp .env.example .env
# Edit .env and set VITE_GEMINI_API_KEY (and optionally VITE_GEMINI_API_URL)
```

Important env names:

- Backend
  - `MONGO_URI` — MongoDB connection string (e.g., mongodb+srv://user:pass@cluster0.mongodb.net/db)
  - `JWT_SECRET` — secret used to sign JWT tokens
  - `PORT` — optional server port (default 4000)

- Frontend (Vite)
  - `VITE_GEMINI_API_KEY` — API key for Gemini (or another generative model provider).
  - `VITE_GEMINI_API_URL` — optional custom API URL

## Start the backend

From `backend/`:

```powershell
npm run dev
```

The backend will read `backend/.env` and start on the configured port (default 4000).

## Start the frontend

From `frontend/`:

```powershell
npm run dev
```

Open the app at `http://localhost:8080` (Vite will print the exact URL).

## Generating plans and exporting PDF

- Use the chat UI to enter a goal and click the Generate button.
- The generated tasks will appear in the right-side panel. Click Export PDF to download.

## If you don't have an API Key for the model

The frontend includes `ApiKeySetup` UI which can prompt you to supply an API key for testing. Alternatively, you can set `VITE_GEMINI_API_KEY` in `frontend/.env` for local development.

## Security notes

- `.env` files are ignored by the repo's `.gitignore`. Never commit production secrets.
- If you regenerate `package-lock.json` or change dependencies, inspect changes before committing.

## Troubleshooting

- Backend exits immediately with `MONGO_URI is required`:
  - Ensure `backend/.env` contains a valid `MONGO_URI`.

- Frontend can't reach backend or API:
  - Check frontend `env` variables and CORS settings in `backend/src/index.ts`.

## Contributing

- Create a branch, make changes, run tests (if any), and open a pull request.

## Contact

If you need help running or configuring the project, paste console logs and I can help diagnose.

gmail - bharadwaja.css@gmail.com
