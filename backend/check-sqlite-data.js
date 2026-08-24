const Database = require('better-sqlite3');
const path = require('path');

const sqliteDbPath = path.join(__dirname, 'data', 'app.sqlite');
const sqlite = new Database(sqliteDbPath, { readonly: true });

console.log('=== Data in SQLite Database ===\n');

const tables = sqlite.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
  `).all();

for (const table of tables) {
  const tableName = table.name;
  const count = sqlite.prepare(`SELECT COUNT(*) as cnt FROM "${tableName}"`).get();
  console.log(`${tableName}: ${count.cnt} rows`);
  
  if (count.cnt > 0 && count.cnt <= 5) {
    const rows = sqlite.prepare(`SELECT * FROM "${tableName}" LIMIT 3`).all();
    rows.forEach((row, i) => {
      console.log(`  [${i + 1}]`, JSON.stringify(row).substring(0, 200));
    });
  }
}

sqlite.close();
