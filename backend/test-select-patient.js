const { Pool } = require('pg');

async function test() {
  const pool = new Pool({
    host: 'ehcg1.ddns.net',
    port: 7001,
    database: 'test_bvducgiang',
    user: 'ictu_test',
    password: 'ictu_test',
    ssl: false,
  });

  const client = await pool.connect();
  try {
    const result = await client.query('SELECT patientrecordid, patientid FROM public.tb_patientrecord LIMIT 5');
    console.log('Query result:', result.rows);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

test();
