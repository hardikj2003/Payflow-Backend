import fs from "fs";
import path from "path";
import { pool } from "./client";

const migrationsDir = path.join(__dirname, "../migrations");

async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT NOW()
    );
  `);

  const executed = await pool.query(`SELECT name FROM migrations`);
  const executedSet = new Set(executed.rows.map(r => r.name));

  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (executedSet.has(file)) continue;

    console.log("Running migration:", file);

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO migrations(name) VALUES($1)",
        [file]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  console.log("Migrations complete");
}

runMigrations().then(() => process.exit());
