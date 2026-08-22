const { Client } = require('pg');

const configs = [
  // Try different database names on port 6688
  { host: '27.72.192.2', port: 6688, database: 'postgres', user: 'postgres', password: 'ehcvietnam@123', label: '6688 postgres/postgres/ehcvietnam@123' },
  { host: '27.72.192.2', port: 6688, database: 'postgres', user: 'postgres', password: '', label: '6688 postgres/postgres/empty' },
  { host: '27.72.192.2', port: 6688, database: 'postgres', user: 'ictu_test', password: 'ictu_test', label: '6688 postgres/ictu_test/ictu_test' },
  { host: '27.72.192.2', port: 6688, database: 'bvducgiang', user: 'postgres', password: 'ehcvietnam', label: '6688 bvducgiang/postgres/ehcvietnam(no@)' },
  { host: '27.72.192.2', port: 6688, database: 'bvducgiang', user: 'postgres', password: 'EHCvietnam@123', label: '6688 bvducgiang/postgres/EHCvietnam@123' },
  { host: '27.72.192.2', port: 6688, database: 'bvducgiang', user: 'postgres', password: 'ehcvietnam@123', label: '6688 bvducgiang/postgres/ehcvietnam@123 (retry)' },
  // Try ehcg1.ddns.net on port 5432
  { host: 'ehcg1.ddns.net', port: 5432, database: 'bvducgiang', user: 'postgres', password: 'ehcvietnam@123', label: 'ehcg1:5432 bvducgiang postgres' },
  { host: 'ehcg1.ddns.net', port: 5432, database: 'bvducgiang', user: 'ictu_test', password: 'ictu_test', label: 'ehcg1:5432 bvducgiang ictu_test' },
  // Try 27.72.192.2 on port 5432
  { host: '27.72.192.2', port: 5432, database: 'bvducgiang', user: 'postgres', password: 'ehcvietnam@123', label: '27.72.192.2:5432 bvducgiang postgres' },
  { host: '27.72.192.2', port: 5432, database: 'bvducgiang', user: 'ictu_test', password: 'ictu_test', label: '27.72.192.2:5432 bvducgiang ictu_test' },
  // Try other common ports
  { host: 'ehcg1.ddns.net', port: 5433, database: 'bvducgiang', user: 'postgres', password: 'ehcvietnam@123', label: 'ehcg1:5433 bvducgiang postgres' },
  { host: '27.72.192.2', port: 5432, database: 'test_bvducgiang', user: 'ictu_test', password: 'ictu_test', label: '27.72.192.2:5432 test_bvducgiang ictu_test' },
  { host: '27.72.192.2', port: 6688, database: 'test_bvducgiang', user: 'ictu_test', password: 'ictu_test', label: '27.72.192.2:6688 test_bvducgiang ictu_test' },
];

async function testConfig(cfg) {
  const client = new Client({
    host: cfg.host,
    port: cfg.port,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password,
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    await client.query('SELECT 1');
    console.log(`SUCCESS: ${cfg.label}`);
    await client.end();
  } catch (err) {
    console.log(`FAIL: ${cfg.label} - ${err.message}`);
    await client.end().catch(() => {});
  }
}

async function main() {
  for (const cfg of configs) {
    await testConfig(cfg);
  }
}

main().catch(console.error);
