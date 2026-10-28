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
  if (b.image !== undefined && (typeof b.image !== 'string' || b.image.length > 70000 || (b.image && !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(b.image)))) {
    return res.status(400).json({ error: 'Photo must be a JPEG thumbnail smaller than 70 KB.' });
  }
  const price = b.price;

  const item = {
    id: crypto.randomUUID(),
    title: clean(b.title, 80),
    price,
    image: b.image || '',
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

require('./ai').installAI(app, loadItems);

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
