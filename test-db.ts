import * as mariadb from 'mariadb';

async function test() {
  const pool = mariadb.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "expense_db",
  });
  
  try {
    const conn = await pool.getConnection();
    console.log("Connected successfully!");
    const res = await conn.query("SELECT 1 as val");
    console.log(res);
    conn.release();
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await pool.end();
  }
}

test();
