# SmartTask Backend (MongoDB)

This is a minimal Express + TypeScript backend for the Smart Task Manager app. It provides:

- User authentication (signup/login) using bcrypt and JWT
- Chat storage and message endpoints persisted in MongoDB via Mongoose

Quick start

1. Copy `.env.example` to `.env` and set your `MONGO_URI` and `JWT_SECRET`.

2. Install dependencies and start in dev mode:

```powershell
cd backend
npm install
npm run dev
```

3. The server will run on the port in `.env` (default 4000).

API (overview)

- POST /api/auth/signup -> { email, password, name }
- POST /api/auth/login -> { email, password } -> returns JWT
- GET /api/chats -> Authorization: Bearer <token>
- POST /api/chats -> create a chat
- GET /api/chats/:chatId/messages -> get messages
- POST /api/chats/:chatId/messages -> add message

This is intentionally minimal for local development. For production, secure your secrets and enable HTTPS.
