const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('L:\\NexusCode\\test.db', (err) => {
  if (err) {
    console.error('Could not open database:', err);
  } else {
    console.log('Database created and connected.');
  }
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Database connection closed.');
  }
});
