# Comics Reading Platform — FinalProject

**Author:** Le Ba Long  
**Student ID :** 001504854  

---

## Project Overview

This is a full-stack web application for reading and publishing comics online. Users can read comic chapters, follow authors, buy premium chapters with a virtual wallet, write comments, react to chapters, and receive real-time notifications. Admins can manage comics, users, categories, and view financial/traffic statistics.

**Tech stack:**
- **Frontend:** React 19 + Vite + Bootstrap 5
- **Backend:** Node.js + Express 5 + PostgreSQL 17
- **Real-time:** Socket.IO
- **Image storage:** Cloudinary
- **Payment:** MoMo (sandbox)
- **Email:** Gmail SMTP (Nodemailer)
- **Auth:** JWT + Google OAuth 2.0

---

## Prerequisites

Make sure you have the following installed before starting:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| PostgreSQL | 14+ | https://www.postgresql.org/download |
| Git | any | https://git-scm.com |

---

## Step 1 — Set Up the Database

1. Open **pgAdmin** or **psql** and create a new database:

```sql
CREATE DATABASE comics_db;
```

2. Import the provided SQL backup file to create all tables and seed data:

```bash
psql -U postgres -d comics_db -f comics-backend/comics_db_backup.sql
```

> If you are on Windows and `psql` is not in your PATH, open **pgAdmin** → right-click `comics_db` → **Restore** and select the `.sql` file.

---

## Step 2 — Configure the Backend Environment

1. Go into the backend folder:

```bash
cd comics-backend
```

2. Copy the example environment file:

```bash
cp .env.example .env
```

3. Open `.env` and fill in your values:

```env
# Server
PORT=5000

# PostgreSQL — replace <YOUR_PASSWORD> with your postgres password
DATABASE_URL=postgres://postgres:<YOUR_PASSWORD>@localhost:5432/comics_db

# JWT — any long random string, e.g. "mysecretkey123"
JWT_SECRET=your_jwt_secret_here

# Gmail SMTP — use an App Password, NOT your Gmail login password
# Guide: https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password

# Google OAuth 2.0 — get from https://console.cloud.google.com
GOOGLE_CLIENT_ID=your_google_client_id

# MoMo Payment (sandbox)
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
MOMO_CREATE_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
# Use ngrok to get a public URL when testing locally: https://ngrok.com
MOMO_IPN_URL=https://your-ngrok-url.ngrok-free.app/api/momo/return-confirm
MOMO_REDIRECT_URL=http://localhost:5173/profile

# Cloudinary — get from https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Minimum required to run locally:** `DATABASE_URL`, `JWT_SECRET`. The others are needed for email, payment, image upload, and Google login.

---

## Step 3 — Install & Run the Backend

```bash
cd comics-backend
npm install
npm run dev
```

The backend will start at **http://localhost:5000**

To verify it is working, open this URL in your browser:

```
http://localhost:5000/health
```

You should see: `{"ok":true,"now":"..."}"`

---

## Step 4 — Install & Run the Frontend

Open a **new terminal**, then:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at **http://localhost:5173**

Open your browser and go to **http://localhost:5173**

---

## Step 5 — Log In

- **Register** a new account on the Register page, or
- **Log in with Google** (requires `GOOGLE_CLIENT_ID` in `.env`)

To access the **admin panel**, go to `/admin`. You need to set a user's role to `admin` directly in the database:

```sql
UPDATE users SET role_id = (SELECT id FROM roles WHERE code = 'admin') WHERE email = 'your@email.com';
```

---

## Project Structure

```
.
├── comics-backend/          # Node.js REST API + Socket.IO server
│   ├── routes/              # All API routes (auth, comics, admin, wallet, ...)
│   ├── middleware/          # JWT auth, mailer
│   ├── utils/               # Cloudinary config
│   ├── socket.js            # Socket.IO real-time events
│   ├── db.js                # PostgreSQL connection pool
│   ├── server.js            # App entry point
│   ├── comics_db_backup.sql # Database dump (import this first)
│   └── .env.example         # Environment variable template
│
└── frontend/                # React + Vite SPA
    └── src/
        ├── pages/           # Page components
        │   ├── admin/       # Admin dashboard pages
        │   └── user/        # Comic detail, chapter reader, ...
        └── components/      # Shared UI components
```

---

## Main Features

| Feature | Description |
|---------|-------------|
| Browse & read comics | View comic list, detail page, read chapters |
| User accounts | Register, login, Google OAuth, forgot password |
| Wallet & payment | Top up balance via MoMo, buy premium chapters |
| Comments & reactions | Comment on chapters, like/dislike in real-time |
| Follow authors | Get notified when followed authors post new work |
| Self-published comics | Users can upload their own text-based comics |
| Real-time notifications | Powered by Socket.IO |
| Admin panel | Manage comics, users, categories, finance stats |
| Traffic tracking | Page view analytics for admins |

---

## API Base URL

All backend API routes are prefixed with `/api`:

```
http://localhost:5000/api/...
```

Examples:
- `POST /api/auth/login` — Login
- `GET  /api/external-comics` — Get comics list
- `GET  /api/me` — Get current user info
- `POST /api/momo/return-confirm` — MoMo payment callback

---

## Common Issues

**Cannot connect to database**
- Check that PostgreSQL is running
- Double-check the password in `DATABASE_URL`
- Make sure the database `comics_db` exists and the SQL was imported

**Port already in use**
- Backend uses port `5000`, frontend uses `5173`
- Change `PORT=` in `.env` if port 5000 is taken

**Images not uploading**
- Fill in `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env`

**Google login not working**
- Fill in `GOOGLE_CLIENT_ID` in `.env`
- Make sure `http://localhost:5173` is in the **Authorized JavaScript origins** in Google Cloud Console

---

## Running Both Servers at Once (Optional)

You can run both backend and frontend in one command from the root folder if a root `package.json` with workspaces is configured, but the easiest way is simply to open **two terminal windows** and run each separately as shown in Steps 3 and 4.

---

*Finalproject — Academic Year 2025–2026*
