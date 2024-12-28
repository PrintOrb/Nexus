const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// Database setup
const dbPath = 'L:\\NexusCode\\database.db'; // Path to your SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to the database:', err.message);
  } else {
    console.log(`Connected to SQLite database at ${dbPath}`);
  }
});

// Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.static('public'));

// Route: Fetch all customers
app.get('/api/customers', (req, res) => {
  console.log('Fetching all customers...');
  db.all('SELECT * FROM customers', [], (err, rows) => {
    if (err) {
      console.error('Error fetching customers:', err.message);
      return res.status(500).json({ error: 'Failed to fetch customers' });
    }
    console.log('Customers fetched:', rows);
    res.json(rows);
  });
});

// Route: Fetch a single customer and their items
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
        console.error('Error fetching items for customer:', err.message);
        return res.status(500).json({ error: 'Failed to fetch customer items' });
      }
      res.json({ customer, items });
    });
  });
});

// Route: Add a new customer
app.post('/api/customers', (req, res) => {
  const { name, email, phone } = req.body;

  console.log('Incoming POST request:', { name, email, phone }); // Debugging log

  if (!name) {
    console.error('Customer name is missing.');
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
      console.log('Customer added with ID:', this.lastID); // Debugging log
      res.status(201).json({ message: 'Customer added', id: this.lastID });
    }
  );
});


// Route: Delete a customer
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

// Graceful shutdown to close the database
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Nexus server running on port ${PORT}`);
});
