Live site: https://dharma-task-2.onrender.com

# Secondhand Market

A simple marketplace where people can list used items, browse, search by keyword and category, and mark items as sold.

## Features
- Redesigned dark interface with amber accents, plus a light theme
- Category chips, price sorting, and saved favourites stored on your device
- Rupee pricing and responsive desktop/mobile layouts
- Integrated model-backed MarketMate AI chat with conversation history (requires server API key)
- Browse listings, search, and filter by category
- View item details with contact info
- Post a new item with validation
- Mark an item as sold (hidden from listings)
- `/health` endpoint for uptime checks

## Run locally
1. Install Node.js 18 or newer.
2. `npm install`
3. `npm start`
4. Open http://localhost:3000

Data is stored in `data/items.json` (created automatically, git-ignored). To change the location, set `DATA_FILE`.

## Deploy on Render (free)
1. Push this repo to GitHub.
2. In Render, choose **New > Web Service** and connect `guruvelah/dharma-task`, branch `main`. Leave Root Directory blank. Create a new service: the existing Docker service cannot be fixed by changing its commands.
3. Runtime: Node. Build command: `npm install`. Start command: `npm start`. Instance type: Free.
4. Render supplies PORT. The base marketplace needs no environment variables. The AI assistant additionally requires GEMINI_API_KEY or OPENAI_API_KEY as explained below. Deploy, then open the exact HTTPS URL Render provides.
5. Verify `/health`, create an item, and mark it sold. Update the live link above. Ask before deleting the old Docker service.

Note: the free Render disk is ephemeral, so `items.json` resets on redeploy or restart. Free instances sleep when idle; the first request can take up to a minute. Persistent disks are not available on the free service.

## Requirement checklist
- [x] Node.js + Express server
- [x] Listings with create, read, search, filter, and sold status
- [x] Responsive single-page UI
- [x] Health check endpoint
- [x] JSON API validation and JSON 404 responses
- [x] `.env`, `data/`, `node_modules/`, and logs excluded
- [x] Confirmed live URL added
- [ ] Redesigned UI and chatbot verified on Render

## Proposed improvement
Add user accounts with an owner token so only the seller can mark an item as sold or delete it, and move storage to a database such as MongoDB Atlas (free M0 tier) so data survives redeploys.

This demonstration has no authentication: anyone can mark a listing sold, and contact details are public. Do not post confidential information.

## Integrated AI assistant
MarketMate supports Google Gemini (free-tier option) and OpenAI through server-side API calls. It supports natural-language shopping, follow-up conversation, listing comparisons and description drafting. It receives up to 80 unsold listing summaries; seller contacts and photos are excluded. Recommended item IDs are validated against real inventory. There is no rules-based chatbot fallback.

### Free-tier option: Google Gemini
1. Open https://aistudio.google.com/apikey and create a key in a project using the **Free tier**.
2. In Render → Environment → Add variable, set `GEMINI_API_KEY` to that key.
3. Save and deploy the latest `main` commit. No OpenAI key is needed.

Gemini takes priority when its key exists. The default model is `gemini-3.5-flash-lite`; `GEMINI_MODEL` is optional. Free usage has provider quotas and eligibility restrictions; keep the project on the free tier and do not enable billing to preserve the no-cost setup. There is no automatic paid fallback when quota runs out. Google may use free-tier inputs/outputs to improve its products; avoid sensitive content. Source: https://ai.google.dev/gemini-api/docs/pricing

### Optional paid OpenAI setup in Render
1. Open the `dharma-task-2` service → Environment.
2. Add `OPENAI_API_KEY` using your own OpenAI API key. Keep the key in Render only: never put it in GitHub, frontend code, screenshots or chat.
3. Save and deploy the latest `main` commit.
4. Confirm `/api/chat/status` returns `configured: true`, then send a message in the app. A configured key still needs working provider access and quota.

API use may incur provider charges. Configure provider spending limits before enabling a public demo. The app limits total AI requests to 30/minute and 3 concurrent requests per process; these are not a durable billing cap. No provider account, key or billing was created by the implementation.

Without a key, the app explicitly shows AI setup needed and `/api/chat` returns HTTP 503. It does not pretend a canned answer is AI. Users are informed that chat messages and listing descriptions go to OpenAI. Chat history is held in browser memory; OpenAI requests use `store: false`; Gemini free-tier data is subject to Google’s data-use terms.

## App interface
The responsive workspace includes Explore, Saved, Create listing and AI assistant tabs, a central AI finder, category discovery cards, sorting, budget filtering, dark/light themes and seller photo uploads. Photos are compressed to JPEG thumbnails on the device (70 KB encoded maximum), preserving the 100 KB JSON request limit. Illustrations are used only for listings without a photo. Category discovery cards are navigation, not fabricated listings.

## Verification
Local API validation and mocked AI transport tests cover conversation history, structured response parsing, unknown item ID rejection, provider authentication/quota errors and missing-key handling. Mocked tests are not proof of a real provider response. The live model test is pending the owner's API credential and deployment. The previously deployed version passed health/create/read/search/filter/sold checks; the new version still requires live verification.

Troubleshooting: the previous 2.5 default may be inaccessible to new Google projects. Use `GEMINI_MODEL=gemini-3.5-flash-lite` if overriding the default. Provider HTTP 400, 404, 429 and authentication failures now have distinct messages. Model availability remains subject to Google project access and quota.
