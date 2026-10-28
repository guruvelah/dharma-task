const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data', 'items.json');
const CATEGORIES = ['Electronics', 'Furniture', 'Vehicles', 'Clothing', 'Books', 'Other'];

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize only missing storage; never silently discard unreadable data.
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

function loadItems() {
  const items = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!Array.isArray(items)) throw new Error('Invalid item storage');
  return items;
}

function saveItems(items) {
  const temporary = DATA_FILE + '.tmp';
  fs.writeFileSync(temporary, JSON.stringify(items, null, 2));
  fs.renameSync(temporary, DATA_FILE);
}

function clean(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/categories', (req, res) => {
  res.json(CATEGORIES);
});

app.get('/api/items', (req, res) => {
  const q = clean(req.query.q, 100).toLowerCase();
  const category = clean(req.query.category, 40);

  let items = loadItems().filter((i) => !i.sold);
  if (category) items = items.filter((i) => i.category === category);
  if (q) {
    items = items.filter((i) =>
      (i.title + ' ' + i.description).toLowerCase().includes(q)
    );
  }
  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(items);
});

app.get('/api/items/:id', (req, res) => {
  const item = loadItems().find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  res.json(item);
});

app.post('/api/items', (req, res) => {
  const b = req.body || {};
  for (const [field, max, required] of [
    ['title', 80, true], ['description', 1000, false],
    ['location', 80, false], ['contact', 80, true],
  ]) {
    const value = b[field];
    if ((required && (typeof value !== 'string' || !value.trim())) ||
        (value !== undefined && (typeof value !== 'string' || value.length > max))) {
      return res.status(400).json({ error: `${field} must be ${required ? 'nonempty text' : 'text'} of at most ${max} characters.` });
    }
  }
  const price = b.price;

  const item = {
    id: crypto.randomUUID(),
    title: clean(b.title, 80),
    price,
    category: CATEGORIES.includes(b.category) ? b.category : 'Other',
    description: clean(b.description, 1000),
    location: clean(b.location, 80),
    contact: clean(b.contact, 80),
    sold: false,
    createdAt: new Date().toISOString(),
  };

  if (!item.title) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ error: 'Enter a valid price (0 or more).' });
  }
  if (!item.contact) {
    return res.status(400).json({ error: 'Contact details are required.' });
  }

  const items = loadItems();
  items.push(item);
  saveItems(items);
  res.status(201).json(item);
});

app.post('/api/items/:id/sold', (req, res) => {
  const items = loadItems();
  const item = items.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found.' });
  item.sold = true;
  saveItems(items);
  res.json({ ok: true });
});

// A transparent, deterministic assistant: no external AI service or secret required.
app.post('/api/chat', (req, res) => {
  if (typeof req.body?.message !== 'string' || !req.body.message.trim() || req.body.message.length > 500) {
    return res.status(400).json({ error: 'Enter a message between 1 and 500 characters.' });
  }
  const message = req.body.message.trim().toLowerCase();
  const respond = (reply, items = [], action) => res.json({ reply, items, ...(action ? { action } : {}) });
  if (/\b(sell|selling|list an item|create a listing|post an item)\b/.test(message)) {
    return respond('Tap “Sell an item”, add a clear title, a price in rupees, category, condition, location and contact details. Then publish. Your contact is public, so share only what you are comfortable publishing.', [], 'sell');
  }
  if (/\b(safe|safety|scam|payment|paying|tips)\b/.test(message)) {
    return respond('Meet in a busy public place, inspect and test the item before paying, and avoid advance payments to strangers. Never share OTPs or banking passwords. This marketplace does not process payments or verify sellers.');
  }
  if (/\b(sold|remove)\b/.test(message)) return respond('Open an item and choose “Mark as sold”, then confirm. It will disappear from browsing. This demo has no owner authentication, so anyone can mark an item sold.');
  if (/\b(contact|seller|phone)\b/.test(message)) return respond('Open a listing to see the seller’s contact information. Contact them directly to discuss condition, price and pickup. I cannot message sellers or negotiate on your behalf.');
  if (/^(hi|hello|hey|help)[!.? ]*$/.test(message)) return respond('Hi! I am a built-in marketplace helper, not generative AI. Try “books under 500”, “show electronics”, “show all items”, or “how do I sell?”. I search only actual available listings.');
  const aliases = { Electronics: /\b(electronics?|phones?|laptops?|headphones?|computers?)\b/, Furniture: /\b(furniture|chairs?|desks?|sofas?|tables?)\b/, Vehicles: /\b(vehicles?|bikes?|bicycles?|cars?|scooters?)\b/, Clothing: /\b(clothing|clothes|shirts?|jackets?|dresses?|shoes?)\b/, Books: /\b(books?|novels?|textbooks?)\b/, Other: /\bother\b/ };
  const category = CATEGORIES.find(c => aliases[c].test(message));
  const budgetMatch = message.match(/(?:under|below|less than|up to|budget(?: of)?)\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)\s*(k)?\b/);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/,/g, '')) * (budgetMatch[2] ? 1000 : 1) : null;
  const stop = new Set(['show','find','me','all','items','item','available','listings','listing','please','want','need','looking','for','a','an','the','some','under','below','less','than','up','to','budget','of','rs','inr','in','my','buy','get','can','you','i','any']);
  const query = message.replace(budgetMatch?.[0] || /$^/, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w && !stop.has(w) && !CATEGORIES.some(c => c.toLowerCase() === w));
  let matches = loadItems().filter(i => !i.sold && (!category || i.category === category) && (budget === null || i.price <= budget));
  if (query.length) matches = matches.filter(i => query.every(w => (i.title + ' ' + i.description + ' ' + i.category + ' ' + i.location).toLowerCase().includes(w)));
  matches.sort((a,b) => budget !== null ? a.price-b.price : b.createdAt.localeCompare(a.createdAt));
  if (!matches.length) return respond('I found no available listings matching that request. Try a category such as “electronics”, a different keyword, or “show all items”. I can also help you sell or explain safe buying.');
  return respond(`I found ${matches.length} available ${matches.length === 1 ? 'item' : 'items'}${budget !== null ? ' within ₹' + budget.toLocaleString('en-IN') : ''}. ${matches.length > 5 ? 'Here are the first five.' : 'Tap one to view details and seller contact.'}`, matches.slice(0,5).map(({id,title,price,category})=>({id,title,price,category})));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.use((err, req, res, next) => {
  const status = err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 500;
  if (status === 500) console.error('Request failed:', err.message);
  res.status(status).json({ error: status === 413 ? 'Request is too large.' : status === 400 ? 'Invalid JSON body.' : 'Could not access item storage.' });
});

app.listen(PORT, () => {
  console.log(`Secondhand market running on port ${PORT}`);
});
