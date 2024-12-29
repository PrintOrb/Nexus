const express = require('express');
const path = require('path');
const db = require('./db');
const fs = require('fs');
const app = express();

// Determine the base path dynamically
const isPkg = typeof process.pkg !== 'undefined';
const basePath = isPkg ? path.dirname(process.execPath) : __dirname;

// Serve static files dynamically from the executable's directory
const staticPath = path.join(basePath, 'public');
console.log(`Serving static files from: ${staticPath}`);

app.use(express.static(staticPath));

// Serve specific HTML files for their respective routes
app.get('/', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.get('/database.html', (req, res) => {
  res.sendFile(path.join(staticPath, 'database.html'));
});

app.get('/customers.html', (req, res) => {
  res.sendFile(path.join(staticPath, 'customers.html'));
});

// API Routes
app.get('/api/customers', (req, res) => {
  db.all('SELECT * FROM customers', [], (err, rows) => {
    if (err) {
      console.error('Error fetching customers:', err.message);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
    res.json(rows);
  });
});

app.get('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM customers WHERE id = ?', [id], (err, customer) => {
    if (err) {
      console.error('Error fetching customer:', err.message);
      return res.status(500).json({ error: 'Failed to fetch customer' });
    }
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    db.all('SELECT * FROM items WHERE customer_id = ?', [id], (err, items) => {
      if (err) {
        console.error('Error fetching items:', err.message);
        return res.status(500).json({ error: 'Failed to fetch customer items' });
      }
      res.json({ customer, items });
    });
  });
});

app.post('/api/customers', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  db.run(
    'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
    [name, email, phone],
    function (err) {
      if (err) {
        console.error('Error adding customer:', err.message);
        return res.status(500).json({ error: 'Failed to add customer' });
      }
      res.status(201).json({ message: 'Customer added', id: this.lastID });
    }
  );
});

app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  db.run(
    'UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?',
    [name, email, phone, id],
    function (err) {
      if (err) {
        console.error('Error updating customer:', err.message);
        return res.status(500).json({ error: 'Failed to update customer' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json({ message: 'Customer updated' });
    }
  );
});

app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM customers WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting customer:', err.message);
      return res.status(500).json({ error: 'Failed to delete customer' });
    }
    res.json({ message: 'Customer deleted', id });
  });
});

app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM items WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting item:', err.message);
      return res.status(500).json({ error: 'Failed to delete item' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted' });
  });
});

app.get('/api/customers/:id/items', (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM items WHERE customer_id = ?', [id], (err, items) => {
    if (err) {
      console.error('Error fetching items:', err.message);
      return res.status(500).json({ error: 'Failed to fetch items' });
    }
    res.json(items);
  });
});

app.post('/api/customers/:id/items', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Item name is required' });
  }

  db.run(
    'INSERT INTO items (name, customer_id) VALUES (?, ?)',
    [name, id],
    function (err) {
      if (err) {
        console.error('Error adding item:', err.message);
        return res.status(500).json({ error: 'Failed to add item' });
      }
      res.status(201).json({ message: 'Item added', id: this.lastID });
    }
  );
});

// Fallback for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Nexus server running on port ${PORT}`);
});
