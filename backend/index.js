const express = require("express");
const { Pool } = require("pg");
const app = express();
const port = 3000;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB || 'default_db',
});

app.get("/api/health", async (req, res) => {
  const client = await pool.connect();
  const result = await client.query("SELECT NOW()");
  client.release();
  res.json({ serverTime: result.rows[0].now });
});

app.listen(port, () => console.log(`Backend listening on ${port}`));
