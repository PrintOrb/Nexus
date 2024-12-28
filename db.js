const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Hardcoded path to the database file in the /NexusCode/ directory
const basePath = path.join('L:\\', 'NexusCode');
const dbPath = path.join(basePath, 'database.db');

// Debugging logs
console.log(`Base path: ${basePath}`);
console.log(`Database path: ${dbPath}`);

// Check if the database file exists
if (!fs.existsSync(dbPath)) {
  console.error('Database file does not exist at:', dbPath);
  console.log('Ensure the file is correctly placed.');
  console.log('Press Enter to exit...');
  process.stdin.resume();
  process.exit(1);
}

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to the database:', err.message);
    console.log('Press Enter to exit...');
    process.stdin.resume();
    process.exit(1);
  } else {
    console.log('Connected to SQLite database.');
  }

  // Create tables if they do not exist
  db.run(
    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT
    )`,
    (err) => {
      if (err) {
        console.error('Error creating customers table:', err.message);
      } else {
        console.log('Customers table is ready.');
      }
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      customer_id INTEGER,
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    )`,
    (err) => {
      if (err) {
        console.error('Error creating items table:', err.message);
      } else {
        console.log('Items table is ready.');
      }
    }
  );
});

// Keep the window open for debugging if there are issues
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  console.log('Press Ctrl+C to exit...');
  process.stdin.resume();
});

// Export the database connection for use in other parts of the app
module.exports = db;
