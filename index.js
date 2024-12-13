const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Nexus!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Nexus server running on port ${PORT}`);
});
