const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const PORT = 4000; 

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Replace with YOUR OWN Render PostgreSQL URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
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
// Secret link to view all messages
app.get('/view-messages-123', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
        
        let html = `
            <html>
            <head>
                <title>Admin - View Messages</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="p-10 bg-gray-100">
                <h1 class="text-2xl font-bold mb-6 text-blue-600">Jewel's Message Inbox</h1>
                <div class="overflow-x-auto bg-white rounded-lg shadow">
                    <table class="min-w-full table-auto">
                        <thead class="bg-blue-600 text-white">
                            <tr>
                                <th class="px-4 py-2">ID</th>
                                <th class="px-4 py-2">Name</th>
                                <th class="px-4 py-2">Message</th>
                                <th class="px-4 py-2">Date</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        result.rows.forEach(msg => {
            html += `
                <tr class="border-b">
                    <td class="px-4 py-2 font-bold">${msg.id}</td>
                    <td class="px-4 py-2">${msg.name}</td>
                    <td class="px-4 py-2">${msg.message}</td>
                    <td class="px-4 py-2 text-gray-500 text-sm">${msg.created_at}</td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
                <div class="mt-6 text-center">
                    <a href="/" class="text-blue-500 hover:underline">← Back to Portfolio</a>
                </div>
            </body>
            </html>
        `;

        res.send(html);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading messages.");
    }
});
