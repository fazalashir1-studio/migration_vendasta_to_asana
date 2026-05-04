# Vendasta → Asana Sync

A small web app that creates the **Vendasta Executive Report — April 2026** project in Asana with one button click.

## What it creates

| Section | Contents |
|---|---|
| Tasks | 26 tasks (20 in progress, 6 completed) including On-Page SEO Optimization, FAQ Schema |
| Projects | Search Engine Optimization Standard (in progress, 40%) |
| Website Metrics | Active Users, Sessions, Avg Duration, Page Views, New Users, Bounce Rate, Engaged Sessions |
| Traffic Sources | Organic, Direct, Paid Social, Referral, Paid Search |
| SEO Metrics | Keywords Top 10, Avg Position, Page 1 Queries, Clicks, Impressions |
| Listings | Score, Accurate, Errors, Not Found, Citations |
| Leads | Messages, Web Chat Visitors, Conversations, Captured Leads |

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Set your Asana PAT
cp .env.example .env
# Edit .env and set ASANA_PAT=your_token_here

# 3. Start the server
npm start
# → http://localhost:3000

# 4. Open the browser and click "Sync to Asana"
```

---

## Deploy to Railway (recommended — free tier)

1. Push this repo to GitHub (already done on branch `claude/asana-project-creation-msS0l`)
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
3. Select this repository
4. In **Variables**, add:
   ```
   ASANA_PAT = <your_asana_personal_access_token>
   ```
5. Railway auto-detects `Procfile` and `package.json` — click **Deploy**
6. Visit the generated `*.up.railway.app` URL and click **Sync to Asana**

---

## Deploy to Render (free tier)

1. Go to [render.com](https://render.com) → **New** → **Web Service** → connect your repo
2. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
3. Under **Environment**, add:
   ```
   ASANA_PAT = <your_asana_personal_access_token>
   ```
4. Click **Create Web Service** — visit the URL and click **Sync to Asana**

---

## Architecture

```
Browser → GET /          → public/index.html  (static)
Browser → GET /sync      → server.js SSE stream → Asana REST API
```

The server streams progress back to the browser via **Server-Sent Events** so you can watch tasks being created in real time.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ASANA_PAT` | Yes | Asana personal access token |
| `PORT` | No | HTTP port (default: 3000) |
