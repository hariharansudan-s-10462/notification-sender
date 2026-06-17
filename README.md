# Notification Sender PWA

A Progressive Web App that lets authenticated users send web push notifications to all subscribed devices, hosted on Zoho Catalyst AppSail.

---

## How Push Notifications Work in This PWA

Browser push notifications follow a three-party flow between the **browser**, your **backend**, and the browser vendor's **push service** (Google FCM for Chrome, Mozilla for Firefox, etc.).

```
User's Browser                 Your Backend              Push Service (FCM / Mozilla)
──────────────                 ────────────              ──────────────────────────────
1. App asks user for
   notification permission
        │
2. Browser contacts the
   push service and gets
   a unique subscription
   (endpoint + keys)
        │
3. App sends subscription ──▶  4. Backend saves it
   to your API                    in Catalyst DataStore
                                         │
                           5. Admin clicks "Send"
                                         │
                           6. Backend calls          ──▶  7. Push service
                              web-push library              forwards to
                              with VAPID keys               user's browser
                                                                 │
                                                      8. Service worker
                                                         wakes up and
                                                         shows the
                                                         notification
```

### Key Components

| Component | File | Role |
|---|---|---|
| Permission + subscription | `frontend/src/hooks/usePushSubscription.ts` | Asks the user for permission, gets the push subscription from the browser, and sends it to the backend |
| Push event handler | `frontend/public/sw-push.js` | A service worker script that wakes up when a push arrives and calls `showNotification()` |
| Subscription storage | Catalyst DataStore `PushSubscriptions` table | Stores every subscriber's endpoint and encryption keys |
| Push sender | `backend/src/routes/notify.ts` | Loops over all saved subscriptions and calls the `web-push` library to deliver the message |
| VAPID keys | `config/app-config.json` env_variables | Authenticate your server with the push service so it trusts your messages |

---

## Project Structure

```
.
├── frontend/               React + Vite PWA (served as static files by the backend)
│   ├── public/
│   │   └── sw-push.js      Push event handler (runs inside the service worker)
│   └── src/
│       └── hooks/
│           └── usePushSubscription.ts
├── backend/                Express API on Catalyst AppSail
│   └── src/
│       ├── routes/
│       │   ├── notify.ts   POST /api/notify  – sends push to all subscribers
│       │   └── subscriptions.ts  – saves / deletes subscriptions
│       └── services/
│           └── webpush.ts  Initialises the web-push library with VAPID keys
├── config/
│   └── app-config.json     Catalyst AppSail config (runtime command, env vars, memory)
├── bundlify.config.js      Bundles backend + frontend into a single deployable app/
└── catalyst.json           Catalyst project config
```

---

## Prerequisites

- Node.js 20+
- [Catalyst CLI](https://www.zoho.com/catalyst/help/getting-started.html) installed and authenticated (`npm install -g zcatalyst-cli`)
- A Catalyst project with AppSail enabled
- A `PushSubscriptions` DataStore table (see below)

---

## 1. DataStore Setup

Create a table named **`PushSubscriptions`** in your Catalyst DataStore with these columns:

| Column | Type | Description |
|---|---|---|
| `email` | TEXT | Identifies the subscriber |
| `endpoint` | TEXT | The push service URL for this device |
| `p256dh` | TEXT | Public encryption key |
| `auth_key` | TEXT | Auth secret for encrypted payloads |

---

## 2. VAPID Keys

VAPID (Voluntary Application Server Identification) keys prove to the push service that messages are coming from your server.

```sh
npx web-push generate-vapid-keys
```

Copy the output into `config/app-config.json` under `env_variables`:

```json
{
  "env_variables": {
    "NODE_ENV": "production",
    "VAPID_PUBLIC_KEY": "<your-public-key>",
    "VAPID_PRIVATE_KEY": "<your-private-key>",
    "VAPID_SUBJECT": "mailto:your@email.com"
  }
}
```

> The public key is also sent to the browser during subscription so it can verify notifications came from you. Never change the key pair after users have subscribed — existing subscriptions will stop working.

---

## 3. Local Development

```sh
# Install all workspace dependencies
npm run install:all

# Start frontend (port 5173), backend (port 3001), and Catalyst proxy together
npm run dev
```

Create `backend/.env` with your local VAPID keys and Catalyst credentials:

```env
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_SUBJECT=mailto:your@email.com
PORT=3001
```

Vite proxies all `/api/*` requests to `localhost:3001` automatically during development.

---

## 4. Build & Deploy

This project uses [`@catalyst-solutions/bundlify`](https://docs-csu.onslate.in) to compile and bundle everything into a single `app/` folder that Catalyst AppSail can deploy.

```sh
# Build frontend (Vite) + backend (tsc) + bundle into app/
npm run build

# Deploy the bundled app/ to Catalyst AppSail
catalyst deploy
```

### What `npm run build` does

1. **Frontend** — `tsc` type-checks then Vite compiles React into `frontend/dist/`
2. **Backend** — `tsc` compiles TypeScript into `backend/dist/`
3. **Bundlify** — copies everything into `app/`:

```
app/
├── app-config.json         AppSail runtime config (injected as env vars by Catalyst)
├── dist/index.js           Compiled Express server entry point
├── node_modules/           Only the runtime dependencies (tree-shaken by @vercel/nft)
└── public/                 Frontend static files served by Express
    ├── index.html
    ├── sw.js               Generated service worker (precaches PWA shell, handles navigation)
    ├── sw-push.js          Push notification handler
    ├── manifest.webmanifest
    └── assets/
```

---

## 5. How the Service Worker Is Structured

This app uses `vite-plugin-pwa` with the `generateSW` strategy. The generated `sw.js`:

- **Precaches the PWA shell** — `index.html`, icons, and `manifest.webmanifest` (5 small files, ~1 KB total). JS/CSS bundles are intentionally excluded so the app always loads fresh code from the network.
- **Handles navigation** — all page navigations fall back to `index.html` (SPA routing).
- **Imports `sw-push.js`** — the push event listener is kept in a separate file so you can update notification logic without rebuilding the entire service worker.

No runtime caching of API responses or assets is configured — this app is designed to be online-only.

---

## 6. PWA Installation

When a user visits the deployed URL in Chrome or Edge:

1. The browser detects the `manifest.webmanifest` link in `<head>`
2. Chrome shows an **Install** icon in the address bar
3. Clicking it installs the app as a standalone window (no browser UI)
4. On Android the app appears on the home screen; on desktop in the Applications folder

For iOS Safari: tap the Share button → **Add to Home Screen**.

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/vapid/public-key` | Returns the VAPID public key for the browser to use when subscribing |
| `POST` | `/api/subscriptions` | Save a new push subscription |
| `DELETE` | `/api/subscriptions` | Remove a subscription |
| `POST` | `/api/notify` | Send a push notification to all subscribers |
| `GET` | `/api/auth/status` | Check if the current session is authenticated |
