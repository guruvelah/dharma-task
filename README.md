# Secondhand Market

Live site: _add your Render URL here after deploying_

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
2. In Render, choose New > Web Service and connect the repo.
3. Runtime: Node. Build command: `npm install`. Start command: `npm start`. Instance type: Free.
4. Deploy, then open the HTTPS URL Render provides.

Note: the free Render disk is ephemeral, so `items.json` resets on redeploy or restart. For persistence, attach a Render disk and set `DATA_FILE` to a path on it.

## Requirement checklist
- [x] Node.js + Express server
- [x] Listings with create, read, search, filter, and sold status
- [x] Responsive single-page UI
- [x] Health check endpoint
- [x] No secrets in the repository

## Proposed improvement
Add user accounts with an owner token so only the seller can mark an item as sold or delete it, and move storage to a database such as MongoDB Atlas (free M0 tier) so data survives redeploys.
