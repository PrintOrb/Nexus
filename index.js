const express = require('express');
const path = require('path');
const db = require('./db');
const fs = require('fs');
const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Determine base path dynamically
const isPkg = typeof process.pkg !== 'undefined';
const basePath = isPkg ? path.dirname(process.execPath) : __dirname;

// Database and public directory paths
const dbPath = path.join(basePath, 'database.db');
const staticPath = path.join(basePath, 'public');

// Log paths for debugging
console.log(`Base Path: ${basePath}`);
console.log(`Database Path: ${dbPath}`);
console.log(`Static Files Path: ${staticPath}`);

// Serve static files
if (!fs.existsSync(staticPath)) {
  console.error(`Static files directory not found: ${staticPath}`);
  console.log('Ensure the "public" directory is in the correct location.');
  process.exit(1);
}
app.use(express.static(staticPath));

// Set up database connection
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found: ${dbPath}`);
  console.log('Ensure the database file is in the correct location.');
  process.exit(1);
}
const sqlite3 = require('sqlite3').verbose();
const database = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the database.');
});

// Define routes
app.get('/', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

app.get('/api/customers', (req, res) => {
  database.all('SELECT * FROM customers', [], (err, rows) => {
    if (err) {
      console.error('Error fetching customers:', err.message);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
    res.json(rows);
  });
});

app.get('/api/customers/search', (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  database.all(
    `SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?`,
    [`%${query}%`, `%${query}%`, `%${query}%`],
    (err, rows) => {
      if (err) {
        console.error('Error searching customers:', err.message);
        return res.status(500).json({ error: 'Failed to search customers' });
      }
      res.json(rows);
    }
  );
});
// Get customer by ID
app.get('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  database.get('SELECT * FROM customers WHERE id = ?', [id], (err, customer) => {
    if (err) {
      console.error('Error fetching customer:', err.message);
      return res.status(500).json({ error: 'Failed to fetch customer' });
    }
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    database.all('SELECT * FROM items WHERE customer_id = ?', [id], (err, items) => {
      if (err) {
        console.error('Error fetching items:', err.message);
        return res.status(500).json({ error: 'Failed to fetch customer items' });
      }
      res.json({ customer, items });
    });
  });
});
// Add customer
app.post('/api/customers', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  database.run(
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
  const { name, email, phone, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  database.run(
    'UPDATE customers SET name = ?, email = ?, phone = ?, notes = ? WHERE id = ?',
    [name, email, phone, notes, id],
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
// Delete customer
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  database.run('DELETE FROM customers WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting customer:', err.message);
      return res.status(500).json({ error: 'Failed to delete customer' });
    }
    res.json({ message: 'Customer deleted', id });
  });
});
// Delete item
app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  database.run('DELETE FROM items WHERE id = ?', [id], function (err) {
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
// Get items for customer
app.get('/api/customers/:id/items', (req, res) => {
  const { id } = req.params;
  database.all('SELECT * FROM items WHERE customer_id = ?', [id], (err, items) => {
    if (err) {
      console.error('Error fetching items:', err.message);
      return res.status(500).json({ error: 'Failed to fetch items' });
    }
    res.json(items);
  });
});
// Add item to customer
app.post('/api/customers/:id/items', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Item name is required' });
  }

  database.run(
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

