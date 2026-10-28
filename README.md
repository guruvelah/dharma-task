Live site: _pending successful Render deployment_

# Secondhand Market

A simple marketplace where people can list used items, browse, search by keyword and category, and mark items as sold.

## Features
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
- [ ] Live Render deployment verified and live link added

## Proposed improvement
Add user accounts with an owner token so only the seller can mark an item as sold or delete it, and move storage to a database such as MongoDB Atlas (free M0 tier) so data survives redeploys.

This demonstration has no authentication: anyone can mark a listing sold, and contact details are public. Do not post confidential information.
