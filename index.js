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

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneDigits = phone.replace(/[^0-9]/g, ''); // Remove non-numeric characters
  const phoneRegex = /^\d{10}$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (!phoneRegex.test(phoneDigits)) {
    return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
  }

  const formattedPhone = `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`;

  database.run(
    'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
    [name, email, formattedPhone],
    function (err) {
      if (err) {
        console.error('Error adding customer:', err.message);
        return res.status(500).json({ error: 'Failed to add customer' });
      }
      res.status(201).json({ message: 'Customer added', id: this.lastID });
    }
  );
});

//
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

// Get tickets
app.get('/api/tickets', (req, res) => {
  const { type, status, customerId } = req.query;

  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (customerId) {
    query += ' AND customer_id = ?';
    params.push(customerId);
  }

  database.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching tickets:', err.message);
      return res.status(500).json({ error: 'Failed to fetch tickets', details: err.message });
    }
    res.json(rows);
  });
});

// Get ticket by ID
app.get('/api/customers/:customerId/tickets', (req, res) => {
  const { customerId } = req.params;

  const query = `
    SELECT id, type, description, status, created_at 
    FROM tickets 
    WHERE customer_id = ?
    ORDER BY created_at DESC
  `;

  database.all(query, [customerId], (err, rows) => {
    if (err) {
      console.error('Error fetching customer tickets:', err.message);
      return res.status(500).json({ error: 'Failed to fetch customer tickets' });
    }
    res.json(rows);
  });
});

// Add ticket
app.get('/api/tickets/:ticketId/notes', (req, res) => {
  const { ticketId } = req.params;

  const query = 'SELECT note, created_at FROM ticket_notes WHERE ticket_id = ? ORDER BY created_at ASC';
  database.all(query, [ticketId], (err, rows) => {
    if (err) {
      console.error('Error fetching ticket notes:', err.message);
      return res.status(500).json({ error: 'Failed to fetch ticket notes' });
    }
    res.json(rows);
  });
});

// Add ticket note
app.post('/api/tickets/:ticketId/notes', (req, res) => {
  const { ticketId } = req.params;
  const { note } = req.body; // No need for timeSpent if it's not in the schema

  if (!note) {
    return res.status(400).json({ error: 'Note is required.' });
  }

  const query = `
    INSERT INTO ticket_notes (ticket_id, note, created_at)
    VALUES (?, ?, DATETIME('now'))
  `;

  database.run(query, [ticketId, note], function (err) {
    if (err) {
      console.error('Error adding note:', err.message);
      return res.status(500).json({ error: 'Failed to add note.' });
    }
    res.status(201).json({ message: 'Note added successfully.', id: this.lastID });
  });
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

