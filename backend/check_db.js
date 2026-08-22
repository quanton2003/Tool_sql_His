const Database = require('better-sqlite3');
const db = new Database('./data/app.sqlite');

const updates = [
  ['ehcg1.ddns.net', 'HIS_DB_HOST'],
  ['7001', 'HIS_DB_PORT'],
  ['test_bvducgiang', 'HIS_DB_NAME'],
  ['ictu_test', 'HIS_DB_USER'],
  ['ictu_test', 'HIS_DB_PASSWORD'],
];

const stmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
for (const [val, key] of updates) {
  const info = stmt.run(val, key);
  console.log(`Updated ${key}: ${info.changes} row(s) affected`);
}

db.exec('PRAGMA wal_checkpoint(FULL);');
db.close();

// Reopen and verify
const db2 = new Database('./data/app.sqlite');
const rows = db2.prepare("SELECT key, value FROM settings WHERE key LIKE 'HIS_DB_%'").all();
console.log('After update:', JSON.stringify(rows, null, 2));
db2.close();
