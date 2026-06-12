# Notification Sender

A PWA that lets authenticated users send web push notifications to subscribed devices, hosted on Catalyst AppSail.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript + vite-plugin-pwa (generateSW) |
| Backend | Node.js 20 + TypeScript + Express on Catalyst AppSail |
| Auth | Catalyst Authentication (session-based) |
| Push | Web Push API + `web-push` npm package (VAPID) |
| Storage | Catalyst DataStore (`PushSubscriptions` table) |

## VAPID Key Generation

```sh
npx web-push generate-vapid-keys
```

Set the output as AppSail environment variables in the Catalyst console:

| Variable | Description |
|---|---|
| `VAPID_PUBLIC_KEY` | Public key from the command above |
| `VAPID_PRIVATE_KEY` | Private key from the command above |
| `VAPID_SUBJECT` | `mailto:your@email.com` |
| `CATALYST_PROJECT_ID` | Your Catalyst project ID |
| `CATALYST_AUTH_BASE_URL` | `https://catalyst.zoho.com` (or your region URL) |
| `APP_URL` | Your AppSail public URL |

## DataStore Table

Create the `PushSubscriptions` table in your Catalyst DataStore with these columns:

| Column | Type |
|---|---|
| `email` | TEXT |
| `endpoint` | TEXT |
| `p256dh` | TEXT |
| `auth_key` | TEXT |

## Local Development

```sh
# Install all dependencies
npm run install:all

# Copy and fill in backend env vars
cp backend/.env.example backend/.env

# Start frontend (port 5173) and backend (port 3000) concurrently
npm run dev
```

Vite proxies all `/api/*` requests to `localhost:3000` automatically.

## Deploy to Catalyst AppSail

1. Run `catalyst init` in the repo root to link to your `notification-sender` Catalyst project.
2. Set all environment variables in the Catalyst AppSail console (do not commit `.env` to git).
3. Run `catalyst deploy` from the repo root.

## Service Worker

- **Precaching**: Handled automatically by `vite-plugin-pwa` (generateSW strategy).
- **Push events**: Handled by `frontend/public/sw-push.js` — imported via `importScripts` in the generated SW.

> Replace `frontend/public/favicon.svg` with proper PNG icons (192×192 and 512×512) for production PWA installation.
