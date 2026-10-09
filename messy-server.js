const express = require('express');
const app = express();
app.use(express.json());

let d = [
  { i: 1, n: "Laptop", p: 45000, q: 10, c: "electronics" },
  { i: 2, n: "Headphones", p: 3500, q: 25, c: "electronics" },
  { i: 3, n: "Notebook", p: 150, q: 100, c: "stationery" },
  { i: 4, n: "Pen", p: 50, q: 200, c: "stationery" },
  { i: 5, n: "Backpack", p: 2500, q: 15, c: "accessories" },
  { i: 6, n: "USB Cable", p: 500, q: 50, c: "electronics" },
];
let x = 7;

app.get('/api/items', (req, res) => {
  let r = d;
  if (req.query.c) {
    r = r.filter(item => item.c === req.query.c);
  }
  if (req.query.min) {
    r = r.filter(item => item.p >= req.query.min);
  }
  if (req.query.max) {
    r = r.filter(item => item.p <= req.query.max);
  }
  res.json(r);
});

app.get('/api/items/:id', (req, res) => {
  let f = d.find(item => item.i == req.params.id);
  if (f) { res.json(f); } else { res.status(404).json({ msg: "not found" }); }
});

app.post('/api/items', (req, res) => {
  let item = { i: x, n: req.body.n, p: req.body.p, q: req.body.q || 0, c: req.body.c || "general" };
  x = x + 1;
  d.push(item);
  res.json(item);
});

app.put('/api/items/:id', (req, res) => {
  let f = d.find(item => item.i == req.params.id);
  if (f) {
    f.n = req.body.n || f.n;
    f.p = req.body.p || f.p;
    f.q = req.body.q || f.q;
    f.c = req.body.c || f.c;
    res.json(f);
  } else {
    res.status(404).json({ msg: "not found" });
  }
});

app.delete('/api/items/:id', (req, res) => {
  let idx = d.findIndex(item => item.i == req.params.id);
  if (idx !== -1) {
    d.splice(idx, 1);
    res.json({ msg: "deleted" });
  } else {
    res.status(404).json({ msg: "not found" });
  }
});

app.get('/api/stats', (req, res) => {
  let total = 0;
  for (let item of d) { total = total + (item.p * item.q); }
  let cats = {};
  for (let item of d) { if (!cats[item.c]) cats[item.c] = 0; cats[item.c]++; }
  res.json({ totalValue: total, categories: cats, itemCount: d.length });
});

app.listen(3000);
