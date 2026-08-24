const Database = require('better-sqlite3');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sqliteDbPath = path.join(__dirname, 'data', 'app.sqlite');
const postgresUrl = process.env.DATABASE_URL;

if (!postgresUrl) {
  console.error('Thiếu DATABASE_URL. Chạy: DATABASE_URL=postgresql://... node migrate-sqlite-to-pg.js');
  process.exit(1);
}

async function migrate() {
  console.log('=== Migrating SQLite to PostgreSQL ===\n');

  // Connect to SQLite
  const sqlite = new Database(sqliteDbPath, { readonly: true });
  console.log('Connected to SQLite');

  // Connect to PostgreSQL
  const pg = new Client({ connectionString: postgresUrl, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  console.log('Connected to PostgreSQL');

  // Get all tables from SQLite
  const tables = sqlite.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  console.log(`\nFound ${tables.length} tables: ${tables.map(t => t.name).join(', ')}\n`);

  for (const table of tables) {
    const tableName = table.name;
    const rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all();
    
    if (rows.length === 0) {
      console.log(`  ${tableName}: 0 rows (skipped)`);
      continue;
    }

    // Get column names
    const columns = Object.keys(rows[0]);
    const columnList = columns.map(c => `"${c}"`).join(', ');
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    console.log(`  ${tableName}: ${rows.length} rows...`);

    // Insert rows
    let inserted = 0;
    for (const row of rows) {
      const values = columns.map(c => {
        const val = row[c];
        if (val === null) return null;
        if (typeof val === 'boolean') return val ? 1 : 0;
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
      });

      try {
        await pg.query(
          `INSERT INTO "${tableName}" (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
          values
        );
        inserted++;
      } catch (err) {
        if (!err.message.includes('duplicate')) {
          console.error(`    Error: ${err.message}`);
        }
      }
    }

    console.log(`    -> Inserted ${inserted} rows`);
  }

  sqlite.close();
  await pg.end();

  console.log('\n=== Migration complete! ===');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
