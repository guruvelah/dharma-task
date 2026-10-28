Live site: https://dharma-task-2.onrender.com

# Secondhand Market

A simple marketplace where people can list used items, browse, search by keyword and category, and mark items as sold.

## Features
- Redesigned dark interface with amber accents, plus a light theme
- Category chips, price sorting, and saved favourites stored on your device
- Rupee pricing and responsive desktop/mobile layouts
- Integrated MarketMate chat panel with live listing search and budget matching
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
4. Do not add environment variables; Render supplies PORT. Deploy, then open the exact HTTPS URL Render provides.
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

## Integrated chatbot
MarketMate uses `POST /api/chat` and built-in intent rules. It searches real, unsold listings, supports requests such as `books under 500`, opens listing details, and explains listing, contact, sold status, and safe buying. It is **not generative AI** and needs no API keys or additional environment variables. Unsupported requests receive guidance rather than fabricated listings. Messages are not stored. Category illustrations are decorative, not seller-uploaded photographs.

## Verification of the redesign
Local checks cover health, listing creation and validation, search and categories, sold-item removal, malformed JSON, desktop and 375px browser flows, saved favourites, theme switching, and chatbot lookup/budget/selling guidance. The confirmed live URL is shown above. On 28 October 2026 the health endpoint returned HTTP 200 with status ok, but the site still served the earlier UI. Deploy the latest main commit on Render to activate the redesign and chatbot; their live verification remains pending.
