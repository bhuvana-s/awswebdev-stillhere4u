# StillHere4U — Waitlist Landing

Single-page React waitlist for **stillhere4u.com**. Vite frontend on AWS Amplify Hosting,
serverless backend (Lambda + API Gateway HTTP API + DynamoDB) deployed via SAM.

```
stillhere4u/
├── src/                    # React app (Vite root)
│   ├── main.jsx
│   ├── api.js              # fetch helpers — reads VITE_API_URL
│   └── stillhere_waitlist.jsx
├── index.html
├── vite.config.js
├── amplify.yml             # Amplify Hosting build spec
├── .env.example            # copy to .env.local for local dev
└── infra/                  # SAM backend
    ├── template.yaml
    ├── samconfig.toml
    └── lambda/
        ├── waitlist-post/index.mjs
        └── waitlist-count/index.mjs
```

## 1. Local development

```bash
npm install
cp .env.example .env.local      # then fill in VITE_API_URL after deploying infra
npm run dev                     # http://localhost:5173
```

## 2. Deploy backend (SAM)

Prerequisites: AWS CLI configured, [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) installed.

```bash
cd infra
sam build

# First deploy — generate a strong admin token (≥16 chars) and pass it.
# This token gates the /api/waitlist/stats endpoint used by /#/stats.
sam deploy --guided \
  --parameter-overrides AdminToken=$(openssl rand -hex 24)

# Save the AdminToken value somewhere safe — it isn't shown again.
# Subsequent deploys re-use stored params:
sam deploy
```

Stack outputs include `ApiUrl` and `TableName`. Copy `ApiUrl` — you'll need it for the
frontend `VITE_API_URL` variable.

To narrow CORS once the domain is live, or rotate the admin token:

```bash
sam deploy --parameter-overrides \
  AllowedOrigin=https://stillhere4u.com \
  AdminToken=<new-token>
```

### Resources created

| Resource | Notes |
|---|---|
| `stillhere-waitlist` (DynamoDB) | PK `email` (S), pay-per-request, PITR on |
| `POST /api/waitlist` Lambda | Validates email/role, conditional Put, atomic counter increment |
| `GET /api/waitlist/count` Lambda | Public — reads sentinel item `email = "__counter__"` for social proof |
| `GET /api/waitlist/stats` Lambda | **Admin only** — requires `x-admin-token` header. Scans table, returns totals + signups |
| HTTP API Gateway | CORS configurable via `AllowedOrigin` parameter |

> The counter lives as a sentinel item with `email = "__counter__"` in the same table.
> Filter it out of any signup-list export.

## 3. Deploy frontend (Amplify Hosting)

1. Push this repo to GitHub as **`awswebdev-stillhere4u`**.
2. In the AWS Amplify console: **New app → Host web app → GitHub** and pick the repo + branch (`main`).
3. Amplify auto-detects `amplify.yml`. Confirm `dist` is the artifact directory.
4. Under **App settings → Environment variables**, add:
   - `VITE_API_URL` = the `ApiUrl` from the SAM stack output.
5. Trigger a build. The first deploy lands at `https://main.<app-id>.amplifyapp.com`.

### Custom domain (Route53 → Amplify)

1. **App settings → Domain management → Add domain**, enter `stillhere4u.com`.
2. Amplify detects the Route53 hosted zone in your account and offers to create the
   DNS records automatically. Accept.
3. Configure subdomains:
   - `stillhere4u.com` → `main` branch (apex)
   - `www.stillhere4u.com` → `main` branch (redirect to apex)
4. Amplify provisions the ACM certificate and CloudFront distribution. Verification
   typically takes 15–30 minutes.

## 4. API contract

```
POST /api/waitlist
  Body: { "email": "you@example.com", "role": "Parent", "source": "landing-page" }
  200 : { "count": 42, "alreadySignedUp": false }
  400 : { "error": "invalid email" | "invalid role" | "invalid json" }

GET /api/waitlist/count
  200 : { "count": 42 }

GET /api/waitlist/stats        (admin)
  Header: x-admin-token: <AdminToken from SAM parameter>
  200 : { "total": 42, "totals": { "Parent": 12, ... }, "signups": [ { email, role, timestamp, source }, ... ] }
  401 : { "error": "unauthorized" }
```

Allowed `role` values match the buttons in the landing page:
`Parent`, `Child abroad`, `Caregiver`, `Insurance`, `Employer`, `Just curious`.

## 4a. Admin stats page

Visit `https://stillhere4u.com/#/stats` (or `http://localhost:5173/#/stats` in dev).
A login form prompts for the admin token — paste the value you set during
`sam deploy`. The token is kept in `sessionStorage` (cleared when the tab closes).

The page shows:
- Total signup count and per-role breakdown
- 7-day stacked bar chart by category
- Full signup table sorted newest-first
- CSV export button

To rotate the token, redeploy SAM with a new `AdminToken` value (see section 2).

## 5. Operational notes

- **Idempotency:** `PutCommand` uses `attribute_not_exists(email)`. A duplicate signup
  returns `200 { alreadySignedUp: true }` with the current count and does **not**
  increment.
- **Counter consistency:** The counter is incremented after the conditional put
  succeeds. If the Lambda dies between those two ops the count can drift below
  reality — to fully guarantee atomicity, swap the Put + Update for a
  `TransactWriteItems`. Not done by default to keep cost down.
- **Lambda runtime:** Node.js 20.x bundles AWS SDK v3, so the function directories
  ship with no `node_modules`.
- **CORS:** Default is `*`. Tighten to `https://stillhere4u.com` once the domain is
  attached (see SAM command above).
