const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL, // Use FRONTEND_URL from .env
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

app.use(cors(corsOptions)); // Enable CORS
app.use(express.json()); // Parse JSON payloads

// Middleware to set security headers
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp'); // Optional
  next();
});

// MySQL database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    process.exit(1); // Exit if the database connection fails
  }
  console.log('Connected to MySQL Database on AWS RDS');
});

// Default route for HTTPS root
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome to the API</h1>
    <p>Use the following endpoints to interact with the database:</p>
    <ul>
      <li><a href="/api/create-table">/api/create-table</a> - Create the table</li>
      <li><a href="/api/data">/api/data</a> - Get all data</li>
      <li>POST /api/data - Insert data</li>
      <li>PUT /api/data/:id - Update data</li>
      <li>DELETE /api/data/:id - Delete data</li>
    </ul>
  `);
});

// Endpoint to create a new table
app.get('/api/create-table', (req, res) => {
  const sql = `
    CREATE TABLE IF NOT EXISTS yourtable (
      id INT AUTO_INCREMENT PRIMARY KEY,
      data VARCHAR(255) NOT NULL,
      username VARCHAR(255) NOT NULL
    )
  `;
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send('Table created or already exists');
  });
});

// Endpoint to insert data
app.post('/api/data', (req, res) => {
  const { data, username } = req.body;
  const sql = 'INSERT INTO yourtable SET ?';
  db.query(sql, { data, username }, (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).send('Error inserting data');
    }
    console.log('Data inserted:', result);
    res.send('Data inserted');
  });
});

// Endpoint to fetch data
app.get('/api/data', (req, res) => {
  const sql = 'SELECT * FROM yourtable';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Endpoint to delete data
app.delete('/api/data/:id', (req, res) => {
  const sql = 'DELETE FROM yourtable WHERE id = ?';
  const id = req.params.id;
  db.query(sql, id, (err, result) => {
    if (err) throw err;
    res.send('Data deleted');
  });
});

// Endpoint to update data
app.put('/api/data/:id', (req, res) => {
  const { data } = req.body;
  const sql = 'UPDATE yourtable SET data = ? WHERE id = ?';
  const id = req.params.id;
  db.query(sql, [data, id], (err, result) => {
    if (err) {
      console.error('Error updating data:', err);
      return res.status(500).send('Error updating data');
    }
    console.log('Data updated:', result);
    res.send('Data updated');
  });
});

// HTTPS server setup
const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH),  // Use SSL_KEY_PATH from .env
  cert: fs.readFileSync(process.env.SSL_CERT_PATH), // Use SSL_CERT_PATH from .env
};

https.createServer(httpsOptions, app).listen(process.env.PORT, () => {
  console.log(`API running on HTTPS at https://localhost:${process.env.PORT}`);
});
