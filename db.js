const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Full path to the database file
const dbPath = 'L:\\NexusCode\\database.db';
console.log(`Database path: ${dbPath}`);

// Verify the directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  console.error('Directory does not exist:', path.dirname(dbPath));
  process.exit(1);
} else {
  console.log('Directory exists.');
}

// Connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not open database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database.');
  }

  // Create the table inside the database connection callback
  db.run(
    `CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT
    )`,
    (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Table is ready.');
      }
    }
  );

  // Close the database connection inside the callback
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
});
