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

function loadItems() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveItems(items) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
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
  const price = Number(b.price);

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

app.use((req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

app.listen(PORT, () => {
  console.log(`Secondhand market running on port ${PORT}`);
});
