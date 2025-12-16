import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: process.env.MYSQL_URL,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

export default pool;




