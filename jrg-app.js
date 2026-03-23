const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const PORT = 4000; 

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Replace with YOUR OWN Render PostgreSQL URL
const pool = new Pool({
  connectionString: 'PASTE_YOUR_RENDER_DB_URL_HERE',
  ssl: { rejectUnauthorized: false }
});

// --- NEW: This part creates your table automatically ---
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Database table 'messages' is ready!");
    } catch (err) {
        console.error("Error creating table:", err);
    }
};
initDb(); 
// -------------------------------------------------------

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'jewel-portfolio.html'));
});

app.post('/jewel-submit', async (req, res) => {
    const { name, message } = req.body;
    try {
        await pool.query('INSERT INTO messages (name, message) VALUES ($1, $2)', [name, message]);
        res.send(`
            <div style="text-align:center; padding:50px; font-family:sans-serif;">
                <h1 style="color:#2563eb;">Success, Jewel!</h1>
                <p>Message from ${name} was saved to your database.</p>
                <a href="/" style="color:#2563eb; text-decoration:none; font-weight:bold;">← Back to Portfolio</a>
            </div>
        `);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database connection error.');
    }
});

app.listen(PORT, () => console.log(`Jewel's Portfolio running at http://localhost:${PORT}`));