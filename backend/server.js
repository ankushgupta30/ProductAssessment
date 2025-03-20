const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000; // Use environment port or default to 5000

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON request bodies

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
